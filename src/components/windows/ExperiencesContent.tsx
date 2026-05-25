"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import experiencesData from "@/data/experiences.json";
import { EXPERIENCES_UI } from "@/data/experiences";

export default function ExperiencesContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const filteredResults = experiencesData.filter((exp) => {
    const matchesCategory =
      activeTab === "All" ||
      (activeTab === "Work" && exp.tag === "work") ||
      (activeTab === "Part-Time" && exp.tag === "part-time") ||
      (activeTab === "Organizations" && exp.tag === "organizations");

    const searchTarget = `${exp.title} ${exp.org} ${exp.description} ${exp.team || ""}`.toLowerCase();
    const matchesSearch = searchTarget.includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex h-full flex-col bg-canvas p-4 sm:p-6 text-navy">
      <div className="mb-4 flex flex-col items-center border-b border-navy/20 pb-6 pt-2">
        <h1 className="mb-5 font-serif text-3xl font-bold tracking-tight sm:text-4xl italic">
          {EXPERIENCES_UI.titleMain}
          <span className="opacity-70">{EXPERIENCES_UI.titleAccent}</span>
        </h1>

        <div className="flex w-full max-w-md gap-2">
          <div className="flex flex-1 items-center border-2 border-navy border-b-4 border-r-4 bg-canvas px-2">
            <Search size={14} className="text-navy/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent px-2 py-1.5 text-[12px] font-medium text-navy outline-none placeholder:font-normal placeholder:text-navy/30"
              placeholder={EXPERIENCES_UI.searchPlaceholder}
            />
          </div>
          <button className="border-2 border-navy border-b-4 border-r-4 bg-navy/5 px-4 text-[12px] font-bold text-navy transition-colors hover:bg-navy hover:text-canvas active:translate-x-0.5 active:translate-y-0.5 active:border-b-2 active:border-r-2">
            {EXPERIENCES_UI.searchButton}
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex gap-4 text-[11px] font-bold uppercase tracking-wider">
          {EXPERIENCES_UI.categories.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-1 ${activeTab === tab
                  ? "border-b-2 border-navy text-navy"
                  : "border-b-2 border-transparent text-navy/40 hover:text-navy"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-4">
        <div className="mb-5 font-mono text-[10px] text-navy/50">
          Showing {filteredResults.length} results for &ldquo;{searchQuery || activeTab}&rdquo;
        </div>

        <div className="flex flex-col gap-7">
          {filteredResults.map((exp, idx) => (
            <div key={idx} className="group max-w-2xl">
              <a
                href={exp.link || "#"}
                target={exp.link ? "_blank" : undefined}
                rel="noreferrer"
                className="inline-block text-[15px] font-bold text-navy hover:underline decoration-2 underline-offset-2"
              >
                {exp.title} <span className="font-normal opacity-70">@ {exp.org}</span>
              </a>

              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[10px] font-mono opacity-70">
                <span>{exp.date}</span>
                <span className="opacity-30">•</span>
                <span>{exp.location}</span>
                {exp.team && (
                  <>
                    <span className="opacity-30">•</span>
                    <span className="font-bold underline decoration-navy/20">{exp.team}</span>
                  </>
                )}
              </div>

              <p className="mt-2 text-[12px] leading-relaxed opacity-90 sm:w-11/12">
                {exp.description}
              </p>
            </div>
          ))}

          {filteredResults.length === 0 && (
            <div className="mt-10 py-6 text-center text-[12px] text-navy/60">
              {EXPERIENCES_UI.emptyResultsPrefix}{" "}
              <strong className="text-navy">{searchQuery}</strong>{" "}
              {EXPERIENCES_UI.emptyResultsSuffix}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}