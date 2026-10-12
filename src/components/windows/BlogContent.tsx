"use client";

import { useEffect, useState } from "react";
import blogData from "@/data/blog.json";
import { useWindowStore } from "@/store/useWindowStore";

export default function BlogContent() {
  const [selected, setSelected] = useState(0);
  const setWindowTitle = useWindowStore((s) => s.setWindowTitle);

  const currentEntry = blogData[selected] || null;

  useEffect(() => {
    setWindowTitle("blog", currentEntry ? `${currentEntry.title}.md` : "Blog.md");
  }, [currentEntry, setWindowTitle]);

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

      <div className="flex-1 overflow-auto px-4 py-5 sm:px-8 sm:py-8">
        {currentEntry ? (
          <article className="mx-auto w-full max-w-[640px] pb-12">
            <div className="font-mono text-[11px] text-navy/50">
              {currentEntry.date}
            </div>
            <h3 className="mt-1.5 text-[18px] font-bold leading-snug tracking-tight sm:text-[20px]">
              {currentEntry.title}
            </h3>
            <div
              className="blog-prose mt-6"
              dangerouslySetInnerHTML={{ __html: currentEntry.body }}
            />
          </article>
        ) : (
          <div className="text-navy/50 text-[12px]">No blog posts found.</div>
        )}
      </div>
    </div>
  );
}
