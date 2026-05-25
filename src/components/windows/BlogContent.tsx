"use client";

import { useState } from "react";
import blogData from "@/data/blog.json";

export default function BlogContent() {
  const [selected, setSelected] = useState(0);

  const currentEntry = blogData[selected] || null;

  return (
    <div className="flex h-full flex-col sm:flex-row sm:gap-0">
      <div className="flex shrink-0 gap-0 overflow-x-auto border-b border-navy/10 sm:w-40 sm:flex-col sm:overflow-x-visible sm:border-b-0 sm:border-r">
        {blogData.map((entry, i) => (
          <button
            key={entry.date + entry.title}
            onClick={() => setSelected(i)}
            className={`flex shrink-0 flex-col border-b border-navy/5 p-2 text-left transition-colors sm:w-full ${
              selected === i
                ? "bg-navy text-canvas"
                : "hover:bg-navy/[0.03]"
            }`}
          >
            <span className="font-mono text-[9px] opacity-50">{entry.date}</span>
            <span className="mt-0.5 whitespace-nowrap text-[11px] font-medium leading-tight sm:whitespace-normal">
              {entry.title}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-3 sm:p-4">
        {currentEntry ? (
          <>
            <div className="font-mono text-[10px] text-navy/30">
              {currentEntry.date}
            </div>
            <h3 className="mt-1 text-[14px] font-semibold tracking-tight sm:text-[15px]">
              {currentEntry.title}
            </h3>
            <p className="mt-3 text-[12px] whitespace-pre-wrap leading-relaxed text-navy/60">
              {currentEntry.body}
            </p>
          </>
        ) : (
          <div className="text-navy/50 text-[12px]">No blog posts found.</div>
        )}
      </div>
    </div>
  );
}
