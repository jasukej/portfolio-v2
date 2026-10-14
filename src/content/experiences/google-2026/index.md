---
title: "google: rust-cpp interop"
---

I worked as part of the Crubit team over the summer, primarily in the domain of intermediate representation (IR) design, and optimizing memory usage at the Rust language level. In addition to ergonomic improvements from this new IR, I was able to significantly cut our foreign-function **payload size by ~98%, and overall RAM usage (averaged over our key customers) by 38-70%**. This work was especially significant with regards to Google’s push for urgently securing third-party dependencies and internal code with Rust, and minimizing RAM used for remote builds; this work was presented to high-priority stakeholders who are actively benefitting from Crubit.

- A motivating case study by the Android team: [Rust in Android: move fast and fix things](https://blog.google/security/rust-in-android-move-fast-fix-things/)
- GitHub: [google/crubit](https://github.com/google/crubit)

## What is Crubit?

![[Screenshot 2026-09-24 at 12.21.16 AM.png]]

![[treewalking.png]]

RustConf 2025 introduces what would become the original scope of my project.

![[Screenshot 2026-09-24 at 7.18.49 AM.png]]

### The Crubit Intermediate Representation (IR)

Before: the IR was relatively ad-hoc and referred to a bunch of in-memory structs.

![[Screenshot 2026-09-24 at 7.45.27 AM.png]]

The goal was to define the Crubit IR as a proper interface, which entailed:

1. **Abstraction**: the IR should abstract over both Clang & rustc internals.
2. **Responsiveness**: it should adapt to changes in the upstream compilers.
3. **Backwards compatibility**: we shouldn’t have to massively refactor internal callsites between different versions.

#### What intermediate format do we use?

A great source of learning when working on this project was collecting the distinct requirements, for which some were implicitly found in code or through a larger context of our customers. One of these secondary requirements was to include a shared memory representation.

- **Flatbuffers**: a compact, shared memory representation
  - Didn’t choose because: non-mutable
- **Cap’n Proto**: if our goal was to downsize memory, this was best
  - Didn’t choose because: policies on importing third-party deps
- **Protobufs**
  - Deep integration with internal tooling; in-house maintainers
  - Could work around the non-shared memory representation at the external layer

### Reproducible Profiling

![[pprof.png|This is very much not my actual pprof snapshot, for obvious reasons.]]

I found that our memory actually increased, which kicked off the second part of my project.

![[Screenshot 2026-09-24 at 7.54.36 AM.png]]

The latter half was focused on adding a build-time option in the code and documentation for reproducible profiling.

### Aggressive Optimization

![[Screenshot 2026-09-24 at 7.56.05 AM.png]]

## Learnings

1. What entails “real” engineering: measuring work
2. Examining whether a blocker *is* a blocker
3. Compiler APIs and getting into the weeds of C++ (and some Rust) language design
