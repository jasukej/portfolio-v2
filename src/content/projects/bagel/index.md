---
title: "bagel: a parallelizable build system"
---

Bagel is a lightweight, parallelizable build system written in Rust and C++ that:

- Builds a dependency DAG and schedules commands to run in topological order
- Allows incremental builds by skipping up-to-date targets with hashing
- Supports parallel execution of independent build steps
- Is inspired by Bazel (Google's build system). This is a fun project, and by no means a production-ready system :)

## **Introduction**

With respect to the design of build systems, Bagel narrows down 3 dimensions of optimization:

1. **Minimality** - processing each target only once
2. **Parallelism** - executing independent build steps in parallel to reduce overall build times
3. **Incrementality** - tracking file changes and dependecy relationships to avoid unnecessary rebuilds on unchanged components

Hermeticity is also an important dimension, but we backlog this in favor for key functionality concerning the other three dimensions. Ideally, we would like to have a container image per language toolchain.

A more detailed discussion can be found in docs/design.md.

## **Examples**

The `examples` directory contains several demo projects that can be built with Bagel. Here is an example workflow to compare the serial and parallel execution of `examples/demo`:

```
cd examples/demo
bagel build --json serial.json
bagel build -j --json parallel.json
cat parallel.json
```

### **References**

A lot of the design decisions made in this project are based on the following work:

- Build Systems A La Carte
- Bazel
- Buck

## Design Rationale

Like all systems, we would like a build system to be efficient. Hence, they are designed around the requirement of **minimality**. A system is minimal when it can recompute the smallest possible set of values to execute a task. Make relies on hashed file modification times (this alas, can be mutated at will) to decide whether it must rebuild a source file, or do nothing, as it has previously built an equivalent binary.

Overall, you can imagine a build system as a tool that *updates* your codebase, by systematically executing tasks using information from source files and task description(s). With this, we've defined the invariants of what a build system must do. We have yet to cover *how* it can choose to do so, which lie in two axioms:

- How does it discover the correct order to build these files? In the former example, it could not have built `main.exe` without having built `common.o`, and we cannot rely on the user to provide a correct ordering for a non-trivial chain of dependencies.
- How does it know when to avoid re-building a clean file? Remember that we would like this for the sake of minimality.

**Build System Axioms**

These two choices lie primarily in distinct, but interconnected components:

1. **Scheduler**: Orders tasks such that dependencies for any given task exist and are up-to-date before it itself is executed.
2. **Rebuilder**: Detects whether a file needs to be rebuilt, and rebuilds it if so.

Some other properties that the design of some of these systems opt-in/out of:

3. **Dynamic dependencies**: Given a dependency list `a: b, c`, if `b` or `c` changes, `a` is automatically recomputed. Excel is an example. This often complicates minimality, as the set of dependencies to recompute are no longer statically defined.

4. **Early cutoff**: Tasks often have dependent tasks. If a newly-changed task is executed and produces the same output as the previous task, the build system stops here and does not propagate execution to dependent (parent) tasks.

5. **Remote caching**: Most famously attributed to Bazel, caching the source and content hashes of a build is helpful for repeated builds across a large number of related clients. For Google, this means much less time for an individual developer to build an average task, because it's likely someone else has compiled it. *Bazel similarly holds the history of all executed commands annotated with observed file hashes to bypass the execution of a task by predicting the hash of the result from its dependencies.*

Put together, here is a diagram of build system execution that lists these design choices per component.

Here, Bagel is:

- **Applicative**, in terms of how tasks declare dependencies
- **Topological**, in terms of how work is scheduled
- **Verifying traces:** how an “up-to-date” build is defined
    
    After a successful build, Bagel caches a hash of the target's inputs, command and env. On the next run it recomputes the hash and skips the target if it matches. This differs from *Bazel* because we do not store build outputs themselves under their hash.
    

Running `showcase.sh`:

1. Parsing the dependency graph

![[Screenshot 2026-09-24 at 12.48.20 AM.png]]

2. Run a *fully-sequential* vs. parallel build

![[Screenshot 2026-09-24 at 12.49.16 AM.png]]

![[Screenshot 2026-09-24 at 12.49.36 AM.png]]

3. Perf comparisons

![[Screenshot 2026-09-24 at 12.48.52 AM.png]]
