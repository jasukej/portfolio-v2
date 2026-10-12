"use client";

import { ArrowLeft, ExternalLink } from "lucide-react";
import { EXPERIENCE_WRITEUPS, type Experience } from "@/data/experiences";
import Prose from "@/components/Prose";

export default function ExperienceDetail({
  exp,
  onBack,
}: {
  exp: Experience;
  onBack: () => void;
}) {
  const writeup = exp.writeup ? EXPERIENCE_WRITEUPS[exp.writeup] : undefined;

  return (
    <div className="h-full overflow-auto px-4 py-4 sm:px-8 sm:py-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 font-mono text-[11px] text-navy/60 hover:text-navy"
      >
        <ArrowLeft size={12} />
        Back to results
      </button>

      <article className="mx-auto mt-6 w-full max-w-[560px] pb-10">
        <div className="flex flex-wrap gap-x-2 gap-y-1 font-mono text-[11px] text-navy/50">
          <span>{exp.date}</span>
          <span className="opacity-40">•</span>
          <span>{exp.location}</span>
        </div>

        <h3 className="mt-1.5 text-[18px] font-bold leading-snug tracking-tight sm:text-[20px]">
          {exp.title} <span className="font-normal opacity-70">@ {exp.org}</span>
        </h3>

        {exp.team && (
          <span className="mt-3 inline-block border border-navy px-2 py-0.5 font-mono text-[10px] text-navy">
            {exp.team}
          </span>
        )}

        <div className="mt-6 border-t border-dashed border-navy/30 pt-6">
          {writeup ? (
            <>
              <h2 className="mb-4 text-[16px] font-bold leading-snug">{writeup.title}</h2>
              <Prose html={writeup.body} />
            </>
          ) : (
            // Until a write-up exists, fall back to the one-line summary.
            <p className="blog-prose whitespace-pre-line">{exp.description}</p>
          )}
        </div>

        {exp.link && (
          <a
            href={exp.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-1.5 font-mono text-[11px] text-navy/60 underline decoration-navy/30 underline-offset-4 hover:text-navy hover:decoration-navy"
          >
            <ExternalLink size={12} />
            {exp.org}
          </a>
        )}
      </article>
    </div>
  );
}
