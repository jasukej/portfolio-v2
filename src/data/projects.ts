import projectsJson from "./projects.json";

export type Project = {
  name: string;
  description: string;
  tags: string[];
  year: string;
  url?: string;
};

export const PROJECTS: Project[] = projectsJson;
