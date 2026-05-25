/**
 * Editable site content
 *
 * - about.ts         — About window bio & links
 * - contact.ts       — Contact links & headings
 * - blog.ts          — Blog window tagline
 * - experiences.ts   — Experiences search UI labels
 * - desktop.ts       — Desktop icon labels
 * - terminal.ts      — Terminal welcome text & virtual filesystem
 * - experiences.json — Work / org experience entries
 * - projects.json    — Project list & README content
 * - blog.json        — Generated from src/content/blog/*.md (on dev build)
 */

export { ABOUT } from "./about";
export type {
  AboutParagraph,
  AboutExternalLink,
  AboutWindowLink,
  AboutTextPart,
} from "./about";

export { CONTACT } from "./contact";
export type { ContactLink, ContactLinkIcon } from "./contact";

export { BLOG_META } from "./blog";
export { EXPERIENCES_UI } from "./experiences";
export { DESKTOP_ICONS_LEFT, DESKTOP_ICONS_RIGHT } from "./desktop";
export type { DesktopIconConfig } from "./desktop";

export {
  TERMINAL_WELCOME,
  buildTerminalFileSystem,
} from "./terminal";
export type { BlogEntry, TerminalFileSystemNode } from "./terminal";
