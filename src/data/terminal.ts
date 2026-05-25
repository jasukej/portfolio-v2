import projectsData from "@/data/projects.json";
import blogData from "@/data/blog.json";
import { ABOUT } from "@/data/about";
import { CONTACT } from "@/data/contact";

export type BlogEntry = {
  title: string;
  date: string;
  body: string;
};

export type TerminalFileSystemNode =
  | string
  | string[]
  | { [key: string]: TerminalFileSystemNode };

export const TERMINAL_WELCOME = [
  "portfoliOS Terminal v1.0",
  "Welcome. Type 'help' to see available commands.",
  "",
] as const;

function buildProjectsDir(): Record<string, TerminalFileSystemNode> {
  const projectsDir: Record<string, TerminalFileSystemNode> = {};

  for (const p of projectsData) {
    projectsDir[p.name] = {
      "README.md": [
        `# ${p.name}`,
        `year: ${p.year}`,
        "",
        p.description,
        "",
        `Tags: ${p.tags?.join(", ") ?? ""}`,
        ...(p.url ? [`Repo: ${p.url}`] : []),
      ],
    };
  }

  return projectsDir;
}

function buildDocumentsDir(entries: BlogEntry[]): Record<string, TerminalFileSystemNode> {
  const documentsDir: Record<string, TerminalFileSystemNode> = {};

  for (const entry of entries) {
    const filename = `${entry.date.replace(/-/g, "")}_${entry.title.replace(/\s+/g, "_").toLowerCase()}.txt`;
    documentsDir[filename] = [entry.title, entry.date, "", ...entry.body.split("\n")];
  }

  return documentsDir;
}

function contactLinksJson(): string[] {
  const github = CONTACT.links.find((l) => l.icon === "github");
  const email = CONTACT.links.find((l) => l.icon === "mail");
  const linkedin = CONTACT.links.find((l) => l.icon === "linkedin");

  return [
    "{",
    `  "github": "${github?.value ?? ""}",`,
    `  "email": "${email?.value ?? ""}",`,
    `  "linkedin": "${linkedin?.value ?? ""}"`,
    "}",
  ];
}

export function buildTerminalFileSystem(
  blogEntries: BlogEntry[] = blogData as BlogEntry[]
): Record<string, TerminalFileSystemNode> {
  return {
    home: {
      guest: {
        Applications: {
          "Terminal.app": ["Cannot read binary file"],
          "Settings.app": ["Cannot read binary file"],
          "Contact.app": ["Cannot read binary file"],
          "Blog.app": ["Cannot read binary file"],
          "Experiences.app": ["Cannot read binary file"],
          "Music.app": ["Cannot read binary file"],
          "About.app": ["Cannot read binary file"],
          "Projects.app": ["Cannot read binary file"],
        },
        Desktop: {
          "about.txt": [
            ABOUT.fullName,
            ABOUT.tagline,
            "Building thoughtful, well-crafted software.",
          ],
          "skills.md": [
            "## Technical Proficiencies",
            "- Languages:  TypeScript, Python, Rust, Go",
            "- Frontend:   React, Next.js, Tailwind, Framer Motion",
            "- Backend:    Node.js, PostgreSQL, Redis",
            "- Tools:      Git, Docker, Figma, Linux",
          ],
          "links.json": contactLinksJson(),
          "About.lnk": ["Shortcut to /home/guest/Applications/About.app"],
          "Projects.lnk": ["Shortcut to /home/guest/Applications/Projects.app"],
          "Blog.lnk": ["Shortcut to /home/guest/Applications/Blog.app"],
          "Experiences.lnk": [
            "Shortcut to /home/guest/Applications/Experiences.app",
          ],
          "Music.lnk": ["Shortcut to /home/guest/Applications/Music.app"],
          "Contact.lnk": ["Shortcut to /home/guest/Applications/Contact.app"],
          "Terminal.lnk": ["Shortcut to /home/guest/Applications/Terminal.app"],
          "Settings.lnk": ["Shortcut to /home/guest/Applications/Settings.app"],
        },
        Projects: buildProjectsDir(),
        Documents: buildDocumentsDir(blogEntries),
        Pictures: {
          "README.txt": ["Nothing to see here yet..."],
        },
      },
    },
  };
}
