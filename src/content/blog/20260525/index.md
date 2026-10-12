---
title: "Nix and Match: A Review of Build Systems A La Carte"
date: 2026-03-15
---

**Ever realize that Excel is a build system?** This is one of the claims in Build Systems A La Carte[^mokhov2018], a 2018 paper by Andrey Mokhov, Neil Mitchell, and Simon Peyton Jones. The paper's authorial intent was to survey the design of existing build systems, and more significantly, to provide a novel framework for constructing new ones. It's apparent that the authors have poured a lot of painstaking thought to formalize the paper's thesis, and I highly recommend it to anyone interested in the topic. 

As a prelude, let's imagine a world without build systems. Developers had to write scripts for each of their codebases to ensure their binaries and code were up-to-date. Make was designed to overcome this problem of toil and coupling that comes with a precise script. A user can define the inputs (dependencies), outputs, and commands to execute.

```make
common.o: common.h common.c
	# the -c flag tells gcc to only compile the file, producing `.o` file.
	# by default, it produces an executable.
	gcc -c common.c

main.o: common.h main.c
	gcc -c main.c

main.exe: common.o main.o
	# gcc automatically calls the linker when it is called on object files
	gcc common.o main.o -o main.exe
```

![[Screenshot 2026-08-30 at 3.18.17 PM.png]]

Beyond the clear ergonomics of using a simple, language-agnostic representation, another benefit you may have noticed is **incrementality**. We do not need to rebuild `common.o` if `main.c` has changed, whereas with a script, the full graph of dependencies must all be rebuilt.

The mechanics of this are interesting and variable. Before discussing these design choices, let's talk about _what_ makes something a build system.

Mokhov et al. imagines (software) build systems as an abstraction over a key-value store, where keys are filenames, values are file contents, and the store is the file system. A build system takes a formalization of a task (a build), target keys and a store, and returns a new store in which the target keys and all its dependencies have an up-to-date value. To parse and execute a task description without running into erroneous behaviour such as circular dependencies, each build system has a "calc engine", or scheduler, whose job is to order keys topologically to execute build steps on. These steps are also formalized in the description, which is more colloquially referred to as the build file.

For example, given the Makefile above, Make compiles the C files – keys – into object files (`*.o`) – intermediate values in build system terminology – and then links them to produce an executable file (`*.exe`).

An unorthodox build system is Excel, whose cell-encoded formulas can be interpreted as a task description. The cell identifier (the key, such as "A1"), holds an associated formula (task), which computes into values, and saves the state of the sheet (the store) as a whole. Excel's calc engine allows for dynamic dependencies; meaning it automatically recomputes a cell's value if one of its dependencies have been modified, or if its list of dependencies have been changed.

Like all systems, we would like a build system to be efficient. Hence, they are designed around the requirement of **minimality**. A system is minimal when it can recompute the smallest possible set of values to execute a task. Make relies on file modification times (this alas, can be mutated at will) to decide whether it must rebuild a source file, or do nothing, as it has previously built an equivalent binary.

Overall, you can imagine a build system as a tool that _updates_ your codebase, by systematically executing tasks using information from source files and task description(s). With this, we've defined the invariants of what a build system must do. We have yet to cover _how_ it can choose to do so, which lie in two axioms:
- How does it discover the correct order to build these files? In the former example, it could not have built `main.exe` without having built `common.o`, and we cannot rely on the user to provide a correct ordering for a non-trivial chain of dependencies.
- How does it know when to avoid re-building a clean file? Remember that we would like this for the sake of minimality.

## The Menu: Schedulers and Rebuilders

These two choices lie primarily in distinct, but interconnected components:
1. **Scheduler**: Orders tasks such that dependencies for any given task exist and are up-to-date before it itself is executed.
2. **Rebuilder**: Detects whether a file needs to be rebuilt, and rebuilds it if so.

![[Screenshot 2026-08-31 at 11.08.22 PM.png]]
	
Some other properties that the design of some of these systems opt-in/out of:
1. **Dynamic dependencies**: A task's dependencies are only known once it runs, such as a cell `=IF(C1=1, B2, A2)` that only needs `B2` when `C1` is 1. Excel is an example. This often complicates minimality, as the set of dependencies to recompute are no longer statically defined.
2. **Early cutoff**: Tasks often have dependent tasks. If a newly-changed task is executed and produces the same output as the previous task, the build system stops here and does not propagate execution to dependent (parent) tasks.
3. **Remote caching**: Most famously attributed to Bazel, caching the source and content hashes of a build is helpful for repeated builds across a large number of related clients. For Google, this means much less time for an individual developer to build an average task, because it's likely someone else has compiled it. *Bazel similarly holds the history of all executed commands annotated with observed file hashes to bypass the execution of a task by predicting the hash of the result from its dependencies.*

Put together, here is a diagram of build system execution that lists these design choices per component.
![[Screenshot 2026-08-30 at 3.11.33 PM.png]]

Grounding these design choices with existing examples:

| System           | Used for                                         | Scheduler         | Rebuilder                 |
| ---------------- | ------------------------------------------------ | ----------------- | ------------------------- |
| **Make**         | Standard, no toolchain runner                    | Topological       | Dirty bit (modified time) |
| **Excel**        | ...well                                          | Restarting        | Dirty bit                 |
| **Shake**        | Accurate, runtime-compatible dependency tracking | Suspending        | Verifying traces          |
| **Bazel**        | Monorepos, multiple clients                      | Restarting        | Constructive traces       |
| **Nix**          | Reproducible packages and environments           | Suspending        | Deep constructive traces  |
| **Buck2** (2023) | Meta's monorepo, successor to Buck1              | Suspending (DICE) | Constructive traces       |

The decade since has surfaced a clear trend towards dynamic dependencies & cloud-shared systems, with the release of Buck V2 and Pants V2. As engineering efforts scale with demand, it makes sense that rebuilders are set on content-addressed constructive traces. These terms will not make sense at this point; which is fine. We'll discuss them and come back to concrete examples soon.

## Scheduling Tasks in a Build System

Schedulers are constrained by the type of tasks they can perform:
1. **Topological**: Schedules tasks by topologically ordering build dependencies. Requires that we know the entire build graph upfront, so this scheduler does not support tasks that rely on dynamic dependencies. Examples include Make and Ninja.
2. **Restarting**: Executes tasks in an arbitrary order. If it runs into an out-of-date dependency, it then aborts, builds the dependency, then restarts the aborted task. Examples include Bazel and Excel.
3. **Suspending**: Instead of aborting, when a task requests a dependency, the scheduler suspends the execution of the current task and brings the dependency up-to-date by recursively building it. This makes it a strictly **minimal** version of the restarting scheduler, though with extra complexity by way of allowing re-entrant task execution.

## Applicative, Functor, and Monadic Tasks

The paper defines the abstraction `Task` as a deterministic function, but real-world functions may rely on untracked dependencies, and allow execution of random functions.

Implicitly, the choice of scheduling strategy also influence what tasks a build system can run. How much of a task's dependencies can be seen before it is run?

Let's model a task similarly to the paper: a function that takes a `fetch` callback and uses it to lookup all it depends on. 

```scheme
;; B1 = A1 + A2
(define (b1-app fetch) (+ (fetch "A1") (fetch "A2")))
```

Running it requires a real `fetch` implementation. But we can also extract its dependencies without doing any computation, by running a `fetch` that records the key it was asked for and returns a dummy value. This is important because a build system that knows every dependency upfront can order tasks before running any of them, which is exactly what a topological scheduler needs.

```scheme
(define (deps-of task)
	(define seen '())
	(task (lambda (k) (set! seen (cons k seen)) 0))
	(reverse seen))
	
(deps-of b1-app)
```
Of course, this works: `(deps-of b1-app)` returns `("A1" "A2")`. Tasks like this, whose dependencies can be read off without running them, are **applicative**.


But what if the dependencies `B1` branches on are conditional?

```scheme
;; B1 = IF(C1=1, B2, A2)
(define (b1-mon fetch)
	(if (= (fetch "C1") 1 ) (fetch "B2") (fetch "A2")))
	
(deps-of b1-mon) ;; this would miss "B2"
```
The dummy `fetch` returns `0`, so the `if` falls through to the else branch and `"B2"` is never recorded. This is a **monadic** task: the key it fetches depends on a value it has yet to compute; there is no way of knowing the full dependency graph without running the build on actual source files. This means we can't topologically sort workloads that rely on monadic tasks. Applicative and monadic tasks are two points on a spectrum of how much a task is allowed to do.

A functor task is the degenerate floor: it can only fetch a single dependency and transform its value, like `B1 = A1 * 2`. A monad task, on the other hand, is the ceiling: it can decide what to fetch next based on anything it has already fetched, like `b1-mon` above. Selective tasks are in-between. They can branch on a value, but every branch has to be declared upfront, so a build system can still list all the possible dependencies of `b1-mon` (`C1`, `B2` and `A2`) before running anything. The OCaml build system Dune is built around this idea[^mokhov2019].

## To rebuild, or not to rebuild?

We briefly hand-waved the term "up-to-date" as a per-dependency property, but we now have the primitives to make it more precise. A correct build system is one where it agrees with the starting store on every input, and every non-input key holds the value produced by recomputing its task against the final store. "up-to-date" meaning recomputing a key should return what is already cached.

The rebuilder's job is to decide, for a single key, whether it is up-to-date, ideally without doing any further computation. Largely, systems implement one of four methods, which progress in a decreasing spectrum of computation at the cost of memory.

1. **Dirty bit**: Encode each key as a clean or dirty bit. After a build completes, all keys are clean; before the next, anything changed is marked as dirty. A key rebuilds only if it or one of its dependencies is dirty. Make makes use of file modification times as the "dirty" identifier. However, this method may rebuild more than it is neccesary, as it cannot guarantee that a changed input happened to produce an unchanged output (such as if you changed a comment in your source code). Hence, sacrificing early cutoff for simplicity.
2. **Verifying traces**: Instead of a bit, we can record the hashes of the last-used dependencies. A key is marked dirty when one of these hashes are inequal. This gets us early cutoff back: if a comment change in `main.c` produces the exact same `main.o`, the hashes `main.exe` depends on still match, so it is left alone.
3. **Constructive traces**: What if we took a verifying trace and stored the result itself, rather than just its hash? Now, if the dependency hashes match a trace we have seen before, we can copy the value out of the cache instead of rebuilding it. Because traces are keyed by content, they can be shared between machines, which is what makes Bazel's remote caching possible. The cost is that we keep every result around.
4. **Deep constructive traces**: Instead of hashing a key's immediate dependencies, we hash the source files at the very bottom of its dependency tree. This lets us fetch a result without building any of the intermediate files at all, which is what Nix and Buck1 do. The catch is that we lose early cutoff again, since the intermediate values are never looked at.

## Closing Thoughts

Stripped down, every build system in this post answers the same two questions: in what order should tasks run, and which tasks can be skipped? The scheduler answers the first and the rebuilder answers the second. What I found most useful about the paper is that these two choices are mostly independent, so you can describe a build system by picking one of each, à la carte. Make is a topological scheduler with a dirty bit, Bazel is a restarting scheduler with constructive traces; and you can make your own custom-fit for your specific needs. For some practice, I wrote my own in Rust (which I un-inspiringly named [Bagel](window:projects/bagel)), which is a topological scheduler with verifying traces.

This also exposes combinations that have yet to be productionized. The paper fills one of these gaps itself with Cloud Shake, which pairs Shake's suspending scheduler with Bazel-style constructive traces. Since then, Buck2 has landed in the same spot, which lines up with the trend towards dynamic dependencies and shared caches. As systems scale in complexity, hand-written dependency graphs drift from the code they describe. With a shared cache, a stale result is served to everyone, and hence it is worthwhile to automate dependency discovery with monadic tasks. It's interesting to see even static tools being pulled this way: Make users often have compilers emit a depfile (`gcc -MMD`) listing the headers it actually read, so the next build uses the discovered dependencies instead of Make's native . So, despite the memory and complexity incurred by dynamic dependencies, large codebases seem happy to pay for them in exchange for reliability.

#### References

[^mokhov2018]: Andrey Mokhov, Neil Mitchell, and Simon Peyton Jones. [Build Systems à la Carte](https://doi.org/10.1145/3236774). *Proceedings of the ACM on Programming Languages* 2, ICFP (2018).
[^mokhov2019]: Andrey Mokhov, Georgy Lukyanov, Simon Marlow, and Jeremie Dimino. Selective Applicative Functors. *Proceedings of the ACM on Programming Languages* 3, ICFP (2019).
