---
title: "vbpf: verifying a (ebpf) verifier"
---

I’m working as a research assistant in UBC’s Software Practices Lab on **developing a safe model of the verifier** for bpf kernel programs.  A huge subset of this work entails modelling the eBPF source code and verifier, for which there is yet to be any formal specification. This project was spearheaded by Yanze Li, a PhD student in this lab.

## What are eBPFs?

Extended Berkeley Packet Filters (eBPFs) let you run small, sandboxed programs inside the Linux kernel without writing a kernel module or rebooting, which is extremely time-consuming. The development flow of using eBPFs is typically: write restricted subset of C, compile it to eBPF bytecode, load it via the `bpf()` system call, and attach it to a hook: such as a network packet arriving, or another system call.

For example, we can drop packets at the network interface card (NIC) driver level:

```c
SEC("xdp")
int drop_all(struct xdp_md *ctx) {
	return XDP_DROP;
}
```

Count `execve` calls per process using a map:

```c
struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __type(key, u32);
    __type(value, u64);
    __uint(max_entries, 1024);
} counts SEC(".maps");

SEC("tracepoint/syscalls/sys_enter_execve")
int count_exec(void *ctx) {
    u32 pid = bpf_get_current_pid_tgid() >> 32;
    u64 one = 1, *val = bpf_map_lookup_elem(&counts, &pid);
    else     bpf_map_update_elem(&counts, &pid, &one, BPF_ANY);
    return 0;
}
```

Actually, this program will never be run, because the verifier rejects it! This is because we do not perform a null check for `val`.

### The verifier

At load time, the kernel must prove that the program terminates and never touches invalid memory. So, before it runs any eBPF code, it runs its verifier on it to examine whether this code is *safe*.

![[Screenshot 2026-09-23 at 11.43.36 PM.png]]

Exploring every possible path yields exponential complexity, so the verifier relies on state pruning; in part by substituting the variables in this state with abstract values. 

![[Screenshot 2026-09-23 at 11.37.12 PM.png]]

The verifier does a bit of backtracking: marking certain `tnum`s as *precise* when its value affects whether an operation is safe, or not. These breakpoints include memory reads and writes, pointer arithmetic, helper calls, and the return value. This means for every `tnum`, the verifier must backtrack and discover a range of possible values each of them can take, and check whether any permutation of these values can lead to an unsafe operation. 

![[Screenshot 2026-09-23 at 11.50.39 PM.png]]

![[Screenshot 2026-09-23 at 11.37.53 PM.png]]

### How do we know the verifier is correct?

The verifier is at least 20k lines of C, and its abstract domain operations have had a bunch of soundness bugs. 

Our approach: reimplement these domain operations (tnums, cnums) in F*, a proof-oriented language. Because the abstract result always over-approximates every concrete result, and we prove over the abstract values, we know the semantics themselves are *sound.* This F* code is then extracted to C with an interoperability tool: KaRaMeL, and this C code can be swapped in for the kernel’s version.

### How do we know the verified verifier semantics are correct?

We’ve written conformance tests for the extracted C, and the F* proofs themselves establish that these functions do exactly what they claim to do (algorithmic equivalence). But ultimately, we would like to prove that **the verified implementation is practically identical to the Linux kernel’s.** What better way to measure that than to literally use it in-place in the kernel?

![[Screenshot 2026-09-24 at 7.59.20 AM.png]]

Given that, I want to measure:

- (This model) holds under assumptions
    
    F* version stubs out `gcc` internals and other kernel dependencies, so we would like to write differential checks `a == foo_wrapper(b)`, where the wrapper calls the real implementation to validate these assumptions.
    
- Precision
    
    These functions should produce the same end-to-end results, but also the exact same `veristat` models (intermediate steps)
    
- Backtracking analysis
    
    Similarly, we can use these step logs to evaluate how over-conservative precision marking is – perhaps we can even make the kernel faster!
    
- Performance
    
    Self-explanatory; our verified C should not be any slower than the kernel’s.
    

## Learnings

We’re hoping to get a paper up for PLDI in November, and SOSP. In addition to evaluation, I am also working on open-sourcing the repository and upstreaming it to the root `bpf-next` tree.
