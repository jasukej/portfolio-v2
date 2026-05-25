"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useWindowStore } from "@/store/useWindowStore";

// TODO(content): Refactor this out
const BOOT_LINES = [
  "BIOS v3.2.1 Copyright (C) 2006-2026 Portfolio V2",
  "Checking memory... 640K OK",
  "Extended memory... 261120K OK",
  "",
  "Detecting IDE drives...",
  "  Primary Master: ST-506 HDD 40MB",
  "  Primary Slave:  None",
  "",
  "Loading portfoliOS kernel...",
  "  Mounting /dev/canvas",
  "  Mounting /dev/loader",
  "  Initializing window manager...",
  "  Loading font cache... [Chicago, Geist Mono]",
  "",
  "Starting services:",
  "  [OK] portfolio-daemon",
  "  [OK] clock-service",
  "  [OK] project-index",
  "  [OK] contact-relay",
  "",
  "All systems nominal.",
  "Booting into desktop...",
];

const TOTAL_DURATION = 3200;
const LINE_INTERVAL = TOTAL_DURATION / (BOOT_LINES.length + 6);

export default function LoadingScreen() {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const setBoot = useWindowStore((s) => s.setBoot);

  const finishBoot = useCallback(() => {
    setIsDone(true);
    setBoot(true);
  }, [setBoot]);

  useEffect(() => {
    let lineIndex = 0;

    const interval = setInterval(() => {
      if (lineIndex < BOOT_LINES.length) {
        setVisibleLines((prev) => [...prev, BOOT_LINES[lineIndex]]);
        setProgress(Math.min(((lineIndex + 1) / BOOT_LINES.length) * 100, 100));
        lineIndex++;
      } else {
        clearInterval(interval);
        setProgress(100);
        setTimeout(finishBoot, 400);
      }
    }, LINE_INTERVAL);

    return () => clearInterval(interval);
  }, [finishBoot]);

  return (
    <>
      {!isDone && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-canvas">

          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.03]">
            <div
              className="animate-scanline absolute left-0 h-[2px] w-full bg-navy"
              style={{ top: 0 }}
            />
          </div>

          <div className="w-full max-w-2xl px-8">
            <div className="mb-6 h-[340px] overflow-hidden font-mono text-xs leading-relaxed text-navy/70">
              {visibleLines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.05 }}
                >
                  {line || "\u00A0"}
                </motion.div>
              ))}
              <span className="animate-blink text-navy">_</span>
            </div>

            <div className="h-4 w-full border border-navy/30">
              <motion.div
                className="h-full bg-navy"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.15, ease: "linear" }}
              />
            </div>
            <div className="mt-2 font-mono text-[10px] tracking-wider text-navy/40">
              portfoliOS v1.0 — {Math.round(progress)}% LOADED
            </div>
          </div>
        </div>
      )}
    </>
  );
}
