"use client";

import { useState, useEffect, useRef } from "react";
import { Monitor, Power } from "lucide-react";
import { useWindowStore, type WindowId } from "@/store/useWindowStore";
import { AnimatePresence, motion } from "framer-motion";

function Clock() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
      setDate(
        now.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2 font-mono text-[10px] text-navy/70 sm:gap-3 sm:text-[11px]">
      <span className="hidden sm:inline">{date}</span>
      <span className="text-navy">{time}</span>
    </div>
  );
}

const MENU_ITEMS: { id: WindowId; label: string }[] = [
  { id: "about", label: "About.exe" },
  { id: "experiences", label: "Experiences" },
  { id: "projects", label: "Projects Explorer" },
  { id: "blog", label: "Blog.md" },
  { id: "music", label: "Music Player" },
  { id: "contact", label: "Contact" },
  { id: "terminal", label: "Terminal" },
];

export default function Taskbar() {
  const windows = useWindowStore((s) => s.windows);
  const openWindow = useWindowStore((s) => s.openWindow);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const openWindows = windows.filter((w) => w.isOpen);

  function handleTaskClick(id: WindowId, isMinimized: boolean) {
    if (isMinimized) {
      focusWindow(id);
    } else {
      minimizeWindow(id);
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[999] flex h-10 items-center border-t border-navy bg-canvas px-1.5 sm:px-2">
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-1.5 border border-navy/20 px-2 py-1 text-[11px] font-bold tracking-wide text-navy transition-colors hover:bg-navy/10 sm:px-3"
        >
          <Monitor size={13} />
          <span className="hidden sm:inline">SYSTEM</span>
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.12 }}
              className="absolute bottom-full left-0 mb-1 w-52 border border-navy/20 bg-canvas shadow-[4px_4px_0px_0px_var(--color-navy-light)]"
            >
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    openWindow(item.id);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center px-3 py-2.5 text-left text-[12px] text-navy/70 transition-colors hover:bg-navy/10 hover:text-navy sm:py-2 sm:text-[11px]"
                >
                  {item.label}
                </button>
              ))}

              <div className="border-t border-navy/10 px-3 py-2">
                <div className="flex items-center gap-1.5 text-[10px] text-navy/30">
                  <Power size={10} />
                  portfoliOS v1.0
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mx-1 h-5 w-px bg-navy/15 sm:mx-2" />

      <div className="flex flex-1 items-center gap-1 overflow-x-auto">
        {openWindows.map((w) => (
          <button
            key={w.id}
            onClick={() => handleTaskClick(w.id, w.isMinimized)}
            className={`flex shrink-0 items-center gap-1.5 border px-2 py-1 text-[10px] transition-colors sm:px-3 sm:text-[11px] ${
              w.isMinimized
                ? "border-navy/10 text-navy/40 hover:text-navy/70"
                : "border-navy/25 bg-navy/10 text-navy"
            }`}
          >
            <span className="max-w-[80px] truncate sm:max-w-[120px]">{w.title}</span>
          </button>
        ))}
      </div>

      <Clock />
    </div>
  );
}
