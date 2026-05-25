import type { WindowId } from "@/store/useWindowStore";

export type DesktopIconConfig = {
  id: WindowId;
  label: string;
};

export const DESKTOP_ICONS_LEFT: DesktopIconConfig[] = [
  { id: "about", label: "About" },
  { id: "experiences", label: "Experiences" },
  { id: "projects", label: "Projects" },
  { id: "blog", label: "Blog" },
  { id: "contact", label: "Contact" },
  { id: "terminal", label: "Terminal" },
  { id: "settings", label: "Settings" },
];

export const DESKTOP_ICONS_RIGHT: DesktopIconConfig[] = [
  { id: "music", label: "Music" },
];
