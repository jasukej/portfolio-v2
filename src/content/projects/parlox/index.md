---
title: "parlox: a parallel lox interpreter"
---

parlox is a bytecode interpreter based on Bob Nystrom’s clox from _Crafting Interpreters_, extended with a split C/Rust memory model.

![[demo.mp4]]

High-level interpreters face a sharp trade-off between maximizing single-threaded allocation throughput and scaling to multiple cores, and CPython is the classic example: reference counting mutates object headers on every creation, assignment, and destruction. Because these mutations are inherently thread-unsafe, CPython relies on the Global Interpreter Lock (GIL), which only lets one thread run bytecode at a time. While the GIL ensures the atomicity of individual instructions, it severely bottlenecks multi-core performance.

Free-threaded CPython (3.13+) makes the GIL optional; however, this breaks a bunch of legacy C extensions (ie. `numpy`) that assume single-threaded memory access. Instead of ref-counting, parlox uses a thread-safe, tracing, generational GC, leaning on the observation that “most objects die young” such that it never has to scan the whole heap on every cycle.

**Why not just write the GC natively in C?** Generational collectors involve complex state management (tracing, copying, tenuring, write barriers), which is famously difficult to implement in C. Rust isolates all of the memory state management behind its safety guarantees. For example, `Send`/`Sync` traits enforce thread safety without a GIL (incidentally, the same trick tools like `PyO3` use for CPython extensions).

The bottleneck here is that C execution engines calling into a Rust GC puts the Foreign Function Interface (FFI) boundary on the critical path, which would negate the point of writing the execution loop in C. So the C VM does zero-overhead allocation with a bump allocator (one pointer addition) inside a pre-allocated Nursery, records live references on a shadow stack, and only crosses the FFI boundary once, in bulk, when the Nursery fills up. Rust then traces the roots, promotes survivors into a Tenured heap, and hands C back a fresh Nursery.

I considered other strategies like conservative stack scanning (scanning the stack and conservatively assuming that anything that happens to look like a pointer, points to a valid heap-allocated object); This approach saves a little overhead on `PUSH`/`POP`, but leaks memory through false positives.

![[architecture.svg|Diagram of VM memory: C runs bytecode and bump-allocates; Rust traces, copies, and tenures.]]

I enjoyed working on this primarily to explore PL theory and design, for which the book dives deep into. However, the thesis of the project lies moreso in **coupling a cross-language memory model that gets Rust’s memory safety and concurrent garbage collection, without paying FFI latency every time C allocates an object**. Anecdotally, the FFI overhead should be negligible enough.

The frontend, VM, and bump allocator are done, and C can call into the Rust crate. I'm currently working on the Rust-side collector.

Ditching thread-unsafe ref-counting also allows for native concurrency! One such paradigm I want to implement is Erlang's Actor Model: instead of sharing memory behind a lock, each C VM runs as an independent actor and threads talk through message passing. Naturally, this involves copying messages, which costs CPU and memory proportional to the message size, but I want to explore how this affects performance in highly concurrent workloads, which I will have to do more instrumentation for.
