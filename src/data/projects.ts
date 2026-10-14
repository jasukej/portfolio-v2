import projectsJson from "./projects.json";
import writeupsJson from "./project-writeups.json";

export type Project = {
  name: string;
  description: string;
  tags: string[];
  writeup?: string;
  year: string;
  url?: string;
};

export const PROJECTS: Project[] = projectsJson;

/** Rendered write-ups! Uses the same scripts/generate-content.mjs. */
export const PROJECT_WRITEUPS: Record<string, { title: string; body: string }> =
  writeupsJson;
