"use client";

import { useWindowStore } from "@/store/useWindowStore";
import { Moon, Sun } from "lucide-react";

export default function SettingsContent() {
  const theme = useWindowStore((s) => s.theme);
  const setTheme = useWindowStore((s) => s.setTheme);

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
      </div>
    </div>
  );
}