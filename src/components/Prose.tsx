"use client";

import { useWindowStore, type WindowId } from "@/store/useWindowStore";

/**
 * Renders build-time markdown HTML (see scripts/generate-content.mjs) with the
 * shared `.blog-prose` styles. Links like `[text](window:projects/<name>)`
 * open another window instead of navigating.
 */
export default function Prose({
  html,
  className = "",
}: {
  html: string;
  className?: string;
}) {
  const openWindow = useWindowStore((s) => s.openWindow);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const setSelectedProject = useWindowStore((s) => s.setSelectedProject);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const link = (e.target as HTMLElement).closest("a");
    const href = link?.getAttribute("href");
    if (!href?.startsWith("window:")) return;

    e.preventDefault();
    const [id, item] = href.slice("window:".length).split("/").map(decodeURIComponent);
    if (id === "projects" && item) setSelectedProject(item);
    openWindow(id as WindowId);
    focusWindow(id as WindowId);
  };

  return (
    <div
      className={`blog-prose ${className}`}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
