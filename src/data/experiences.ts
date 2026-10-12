import experiencesJson from "./experiences.json";
import writeupsJson from "./experience-writeups.json";

export type Experience = {
  title: string;
  org: string;
  team?: string;
  link?: string;
  tag: string;
  location: string;
  /** One-line summary shown in the experiences list. */
  description: string;
  /** Folder name of a write-up in src/content/experiences/ shown on the detail page. */
  writeup?: string;
  date: string;
};

export const EXPERIENCES: Experience[] = experiencesJson;

/** Rendered write-ups, generated from markdown by scripts/generate-content.mjs. */
export const EXPERIENCE_WRITEUPS: Record<string, { title: string; body: string }> =
  writeupsJson;

export const EXPERIENCES_UI = {
  titleMain: "Exp",
  titleAccent: "Search",
  categories: ["All", "Work", "Research", "Part-Time", "Organizations"] as const,
  searchPlaceholder: "Search experiences...",
  searchButton: "Search",
  emptyResultsPrefix: "Your search -",
  emptyResultsSuffix: "- did not match any experiences.",
} as const;
