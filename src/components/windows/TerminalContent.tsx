"use client";

import { useState, useRef, useEffect } from "react";
import {
  TERMINAL_WELCOME,
  buildTerminalFileSystem,
  type TerminalFileSystemNode,
} from "@/data/terminal";
import { useWindowStore } from "@/store/useWindowStore";

const FILE_SYSTEM = buildTerminalFileSystem();

const resolvePath = (target: string, currentCwd: string): string => {
  if (target === "~") return "/home/guest";
  if (target.startsWith("~/")) target = "/home/guest/" + target.slice(2);

  const isAbsolute = target.startsWith("/");
  const parts = isAbsolute
    ? target.split("/")
    : currentCwd.split("/").concat(target.split("/"));

  const resolved: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") {
      resolved.pop();
    } else {
      resolved.push(part);
    }
  }
  return "/" + resolved.join("/");
};

const getDir = (path: string): TerminalFileSystemNode | null => {
  if (path === "/") return FILE_SYSTEM;
  const parts = path.split("/").filter(Boolean);
  let current: TerminalFileSystemNode = FILE_SYSTEM;
  for (const part of parts) {
    if (
      typeof current !== "object" ||
      current === null ||
      Array.isArray(current)
    ) {
      return null;
    }
    const node = current as Record<string, TerminalFileSystemNode>;
    const next = node[part];
    if (next === undefined) return null;
    current = next;
  }
  return current;
};

export default function TerminalContent() {
  const theme = useWindowStore((s) => s.theme);
  const [history, setHistory] = useState<string[]>([...TERMINAL_WELCOME]);
  const [input, setInput] = useState("");
  const [cwd, setCwd] = useState("/home/guest");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const terminalGlow =
    theme === "dark" ? "drop-shadow-[0_0_4px_rgba(74,246,38,0.4)]" : "";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rawInput = input.trim();
    const args = rawInput.split(" ").filter(Boolean);
    const cmd = args[0]?.toLowerCase();

    const displayCwd = cwd.startsWith("/home/guest")
      ? cwd.replace("/home/guest", "~")
      : cwd;

    const promptLine = `guest@portfoliOS:${displayCwd}$ ${rawInput}`;
    const newLines = [promptLine];

    if (!cmd) {
      setHistory((prev) => [...prev, promptLine]);
      setInput("");
      return;
    }

    switch (cmd) {
      case "clear":
        setHistory([]);
        setInput("");
        return;

      case "help":
        newLines.push(
          "Available commands:",
          "  ls       — List directory contents",
          "  cd       — Change directory",
          "  cat      — Print file contents (e.g., 'cat about.txt')",
          "  pwd      — Print working directory",
          "  whoami   — Print current user",
          "  date     — Print current system date",
          "  clear    — Clear terminal output",
          "  help     — Show this message",
          ""
        );
        break;

      case "ls": {
        const lsTarget = args[1] ? resolvePath(args[1], cwd) : cwd;
        const lsNode = getDir(lsTarget);
        if (!lsNode) {
          newLines.push(
            `ls: cannot access '${args[1]}': No such file or directory`,
            ""
          );
        } else if (typeof lsNode === "string" || Array.isArray(lsNode)) {
          newLines.push(args[1]!, "");
        } else {
          const dir = lsNode as Record<string, TerminalFileSystemNode>;
          const keys = Object.keys(dir);
          const formatted = keys.map((k) => {
            const child = dir[k];
            return typeof child === "string" || Array.isArray(child)
              ? k
              : `${k}/`;
          });
          newLines.push(formatted.join("  "), "");
        }
        break;
      }

      case "cd": {
        const targetDir = args[1] || "/home/guest";
        const resolvedDir = resolvePath(targetDir, cwd);
        const dirNode = getDir(resolvedDir);

        if (!dirNode) {
          newLines.push(`bash: cd: ${targetDir}: No such file or directory`, "");
        } else if (typeof dirNode === "string" || Array.isArray(dirNode)) {
          newLines.push(`bash: cd: ${targetDir}: Not a directory`, "");
        } else {
          setCwd(resolvedDir);
        }
        break;
      }

      case "cat": {
        const file = args[1];
        if (!file) {
          newLines.push("cat: missing file operand", "");
        } else {
          const resolvedFile = resolvePath(file, cwd);
          const fileNode = getDir(resolvedFile);
          if (!fileNode) {
            newLines.push(`cat: ${file}: No such file or directory`, "");
          } else if (typeof fileNode === "string" || Array.isArray(fileNode)) {
            if (Array.isArray(fileNode)) newLines.push(...fileNode, "");
            else newLines.push(fileNode, "");
          } else {
            newLines.push(`cat: ${file}: Is a directory`, "");
          }
        }
        break;
      }

      case "whoami":
        newLines.push("guest", "");
        break;

      case "pwd":
        newLines.push(cwd, "");
        break;

      case "date":
        newLines.push(new Date().toString(), "");
        break;

      case "echo":
        newLines.push(args.slice(1).join(" "), "");
        break;

      default:
        newLines.push(`bash: ${cmd}: command not found`, "");
    }

    setHistory((prev) => [...prev, ...newLines]);
    setInput("");
  }

  return (
    <div
      className="absolute inset-0 flex flex-col bg-canvas p-4 font-mono text-[13px] text-terminal leading-relaxed"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-terminal/20">
        {history.map((line, i) => (
          <div
            key={i}
            className={`whitespace-pre-wrap text-terminal/90 ${terminalGlow}`}
          >
            {line || "\u00A0"}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-1 shrink-0">
        <span className={`text-terminal font-bold ${terminalGlow}`}>
          guest@portfoliOS:
          {cwd.startsWith("/home/guest") ? cwd.replace("/home/guest", "~") : cwd}$
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={`flex-1 bg-transparent text-terminal outline-none placeholder:text-terminal/30 ${terminalGlow}`}
          autoFocus
          spellCheck={false}
        />
      </form>
    </div>
  );
}
