"use client";

import { useEffect, useState } from "react";
import { ABOUT, type AboutParagraph } from "@/data/about";
import { useWindowStore, type WindowId } from "@/store/useWindowStore";

export default function AboutContent() {
  const [asciiArt, setAsciiArt] = useState<string>("");
  const openWindow = useWindowStore((s) => s.openWindow);
  const focusWindow = useWindowStore((s) => s.focusWindow);

  const handleOpen = (id: WindowId) => {
    openWindow(id);
    focusWindow(id);
  };

  const Link = ({
    children,
    onClick,
    href,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    href?: string;
  }) => {
    const className =
      "inline-flex items-baseline font-medium cursor-pointer decoration-navy/40 underline-offset-4 hover:decoration-navy hover:text-navy hover:underline transition-all duration-200 ease-in-out border-b border-navy/20 hover:border-transparent";

    if (href) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {children}
        </a>
      );
    }

    return (
      <span onClick={onClick} className={className}>
        {children}
      </span>
    );
  };

  const renderParagraph = (paragraph: AboutParagraph) => {
    if (paragraph.type === "plain") {
      return <p>{paragraph.text}</p>;
    }

    return (
      <p>
        {paragraph.parts.map((part, i) => {
          if ("text" in part) {
            return <span key={i}>{part.text}</span>;
          }
          if ("external" in part) {
            return (
              <Link key={i} href={part.external.href}>
                {part.external.label}
              </Link>
            );
          }
          return (
            <Link key={i} onClick={() => handleOpen(part.window.windowId)}>
              {part.window.label}
            </Link>
          );
        })}
      </p>
    );
  };

  useEffect(() => {
    fetch("/ascii.txt")
      .then((res) => res.text())
      .then(setAsciiArt)
      .catch(console.error);
  }, []);

  return (
    <div className="flex h-full flex-row gap-4 h-[390px]">
      <div className="w-[300px] shrink-0 overflow-hidden border border-navy/10 bg-navy/5 flex items-center justify-center p-2">
        <pre className="text-[2px] leading-[2px] text-navy/40 font-mono tracking-tighter whitespace-pre">
          {asciiArt}
        </pre>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-2 pb-2 scrollbar-thin scrollbar-thumb-navy/20">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {ABOUT.fullName}
          </h2>
          <p className="font-mono text-[11px] text-navy/50">{ABOUT.tagline}</p>
        </div>

        <div className="border-t border-navy/10 pt-3 text-[13px] leading-relaxed text-navy/70 space-y-3">
          {ABOUT.paragraphs.map((paragraph, i) => (
            <div key={i}>{renderParagraph(paragraph)}</div>
          ))}
        </div>

        <div className="border-t border-navy/10 pt-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-navy/40">
            Currently Doing
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ABOUT.currentlyDoing.map((item) => (
              <span
                key={item}
                className="border border-navy/15 bg-navy/5 px-2 py-0.5 font-mono text-[10px] text-navy/60"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
