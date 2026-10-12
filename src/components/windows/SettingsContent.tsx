"use client";

import { useWindowStore, type DesktopPattern } from "@/store/useWindowStore";
import { Moon, Sun, Volume2, VolumeX } from "lucide-react";

const DESKTOP_PATTERNS: { id: DesktopPattern; label: string }[] = [
  { id: "grid", label: "Grid" },
  { id: "platinum", label: "Platinum" },
  { id: "classic", label: "Classic" },
];

export default function SettingsContent() {
  const theme = useWindowStore((s) => s.theme);
  const setTheme = useWindowStore((s) => s.setTheme);
  const desktopPattern = useWindowStore((s) => s.desktopPattern);
  const setDesktopPattern = useWindowStore((s) => s.setDesktopPattern);
  const soundEffects = useWindowStore((s) => s.soundEffects);
  const setSoundEffects = useWindowStore((s) => s.setSoundEffects);

  return (
    <div className="flex flex-col h-full bg-canvas text-navy">
      <div className="flex-1">
        <h2 className="text-xl font-bold uppercase tracking-wider border-b-2 border-navy pb-2 mb-4 flex items-center justify-between">
          <span>Appearance</span>
          {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
        </h2>

        <p className="font-mono text-xs text-navy/70 mb-6">
          Customize the global system display.
        </p>

        <div className="flex items-center gap-0 border-2 border-navy p-1 bg-navy/5 shadow-[2px_2px_0px_rgba(0,0,0,0.1)] dark:shadow-[2px_2px_0px_rgba(255,255,255,0.1)] rounded-none">
          <button
            onClick={() => setTheme("light")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all ${
              theme === "light"
                ? "bg-navy text-canvas scale-[0.98] shadow-inner"
                : "bg-transparent text-navy hover:bg-navy/10"
            }`}
          >
            <Sun size={16} />
            Light
          </button>
          <div className="w-[2px] h-8 bg-navy/20"></div>
          <button
            onClick={() => setTheme("dark")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all ${
              theme === "dark"
                ? "bg-navy text-canvas scale-[0.98] shadow-inner"
                : "bg-transparent text-navy hover:bg-navy/10"
            }`}
          >
            <Moon size={16} />
            Dark
          </button>
        </div>

        <h3 className="mt-6 mb-2 font-mono text-xs uppercase tracking-wider text-navy/70">
          Desktop Pattern
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {DESKTOP_PATTERNS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setDesktopPattern(id)}
              className={`flex flex-col items-center gap-1.5 border-2 p-1.5 text-[11px] font-bold uppercase tracking-wider ${
                desktopPattern === id
                  ? "border-navy bg-navy text-canvas"
                  : "border-navy/30 text-navy hover:border-navy"
              }`}
            >
              <span
                className={`block h-10 w-full border border-navy bg-canvas desktop-pattern-${id}`}
              />
              {label}
            </button>
          ))}
        </div>

        <h3 className="mt-6 mb-2 font-mono text-xs uppercase tracking-wider text-navy/70">
          Sound Effects
        </h3>
        <div className="flex items-center gap-0 border-2 border-navy p-1 bg-navy/5">
          {[
            { on: true, label: "On", Icon: Volume2 },
            { on: false, label: "Off", Icon: VolumeX },
          ].map(({ on, label, Icon }) => (
            <button
              key={label}
              onClick={() => setSoundEffects(on)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all ${
                soundEffects === on
                  ? "bg-navy text-canvas"
                  : "bg-transparent text-navy hover:bg-navy/10"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
