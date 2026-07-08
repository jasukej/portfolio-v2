"use client";

import { useEffect, useState } from "react";
import { ABOUT, ABOUT_LINK_CLASS, type AboutParagraph } from "@/data/about";
import { useWindowStore, type WindowId } from "@/store/useWindowStore";
import Image from "next/image";

export default function AboutContent() {
  const [asciiArt, setAsciiArt] = useState<string>("");
  const openWindow = useWindowStore((s) => s.openWindow);
  const focusWindow = useWindowStore((s) => s.focusWindow);

  const handleOpen = (id: WindowId) => {
    openWindow(id);
    focusWindow(id);
  };

  const linkClassName = (cursorClass: string = ABOUT_LINK_CLASS) =>
    `inline-flex items-baseline border-0 bg-transparent p-0 font-inherit text-inherit font-medium ${cursorClass} decoration-navy/40 underline-offset-4 hover:decoration-navy hover:text-navy hover:underline transition-all duration-200 ease-in-out border-b border-navy/20 hover:border-transparent`;

  const Link = ({
    children,
    onClick,
    href,
    className = ABOUT_LINK_CLASS,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    href?: string;
    className?: string;
  }) => {
    const classes = linkClassName(className);

    if (href) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
        >
          {children}
        </a>
      );
    }

    return (
      <button type="button" onClick={onClick} className={classes}>
        {children}
      </button>
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
              <Link
                key={i}
                href={part.external.href}
                className={part.external.className}
              >
                {part.external.label}
              </Link>
            );
          }
          return (
            <Link
              key={i}
              className={part.window.className}
              onClick={() => handleOpen(part.window.windowId)}
            >
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
    <div className="flex h-full flex-row gap-4">
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

        <div className="pt-3 text-[13px] leading-relaxed text-navy/70 space-y-3">
          {ABOUT.paragraphs.map((paragraph, i) => (
            <div key={i}>{renderParagraph(paragraph)}</div>
          ))}
        </div>
        <div className="relative flex items-center justify-between mb-1 h-6">
          <div
            className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[9px]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, var(--color-navy), var(--color-navy) 1px, transparent 1px, transparent 3px)",
              opacity: 0.25,
            }}
          />
          <span className="relative z-10 bg-canvas pr-2 font-mono text-[10px] font-bold uppercase tracking-widest text-navy/40 select-none">
            I also enjoy
          </span>
          <div className="relative z-10 bg-canvas pl-2 flex items-center shrink-0">
            <a
              href={ABOUT.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-6 w-6 items-center justify-center opacity-60 hover:opacity-100 transition-opacity duration-200"
              title="GitHub"
            >
              <Image
                src="/github.svg"
                alt="GitHub"
                width={16}
                height={16}
                className="h-4.5 w-4.5"
                style={{ filter: "var(--icon-invert)" }}
              />
            </a>
            <a
              href={ABOUT.links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-6 w-6 items-center justify-center opacity-60 hover:opacity-100 transition-opacity duration-200"
              title="LinkedIn"
            >
              <Image
                src="/linkedin.svg"
                alt="LinkedIn"
                width={16}
                height={16}
                className="h-4.5 w-4.5"
                style={{ filter: "var(--icon-invert)" }}
              />
            </a>
          </div>
        </div>
        <div className="space-y-1.5 pl-1 font-mono text-[11px] text-navy/70">
          {ABOUT.currentlyDoing.map((item) => (
            <div key={item} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-navy/35 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
