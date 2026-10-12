import type { WindowId } from "@/store/useWindowStore";

export const WINDOW_DIMENSIONS: Record<
  WindowId,
  { width: number; height: number }
> = {
  about: { width: 830, height: 480 },
  projects: { width: 600, height: 450 },
  blog: { width: 700, height: 800 },
  experiences: { width: 600, height: 570 },
  music: { width: 340, height: 540 },
  contact: { width: 460, height: 320 },
  terminal: { width: 580, height: 350 },
  settings: { width: 320, height: 450 },
};

export function getDefaultWindowPositions(): Partial<
  Record<WindowId, { x: number; y: number }>
> {
  const exp = WINDOW_DIMENSIONS.experiences;
  const music = WINDOW_DIMENSIONS.music;
  const terminal = WINDOW_DIMENSIONS.terminal;

  if (typeof window === "undefined") {
    return {
      experiences: { x: 108, y: 48 },
      projects: { x: 640, y: 48 },
      terminal: { x: 108, y: 488 },
      music: { x: 1100, y: 200 },
    };
  }

  const viewportW = window.innerWidth;
  const sidebar = viewportW < 640 ? 16 : 100;
  const top = 48;
  const gap = 12;
  const taskbarHeight = 40;

  const experiencesX = sidebar + gap;
  const projectsX = experiencesX + exp.width + gap;
  // Sit below experiences, but lift it to stay clear of the taskbar on short screens.
  const terminalY = Math.max(
    top,
    Math.min(
      top + exp.height + gap,
      window.innerHeight - terminal.height - taskbarHeight - gap
    )
  );
  const musicX = Math.max(projectsX, viewportW - music.width - 32);

  return {
    experiences: { x: experiencesX, y: top },
    projects: { x: projectsX, y: top },
    terminal: { x: experiencesX, y: terminalY },
    music: { x: musicX, y: top + 120 },
  };
}
