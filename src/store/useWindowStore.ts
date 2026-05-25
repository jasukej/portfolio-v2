import { create } from "zustand";
import { getDefaultWindowPositions } from "@/lib/desktop-layout";

export type WindowId = "about" | "terminal" | "blog" | "projects" | "contact" | "settings" | "experiences" | "music";

export interface WindowState {
  id: WindowId;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  zIndex: number;
  position: { x: number; y: number };
}

interface WindowStore {
  windows: WindowState[];
  nextZIndex: number;
  booted: boolean;
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  setBoot: (booted: boolean) => void;
  openWindow: (id: WindowId) => void;
  closeWindow: (id: WindowId) => void;
  minimizeWindow: (id: WindowId) => void;
  focusWindow: (id: WindowId) => void;
  setWindowPosition: (id: WindowId, position: { x: number; y: number }) => void;
  getWindow: (id: WindowId) => WindowState | undefined;
  applyDesktopLayout: () => void;
}

const initialWindows: WindowState[] = [
  {
    id: "about",
    title: "About.exe",
    isOpen: true,
    isMinimized: false,
    zIndex: 5,
    position: { x: 80, y: 60 }, // choose to center and display on first load
  },
  {
    id: "projects",
    title: "~/projects",
    isOpen: false,
    isMinimized: false,
    zIndex: 0,
    position: { x: 640, y: 48 },
  },
  {
    id: "blog",
    title: "Blog.md",
    isOpen: false,
    isMinimized: false,
    zIndex: 0,
    position: { x: 240, y: 80 },
  },
  {
    id: "contact",
    title: "Contact",
    isOpen: false,
    isMinimized: false,
    zIndex: 0,
    position: { x: 200, y: 120 },
  },
  {
    id: "terminal",
    title: "Terminal",
    isOpen: false,
    isMinimized: false,
    zIndex: 0,
    position: { x: 108, y: 488 },
  },
  {
    id: "settings",
    title: "Settings",
    isOpen: false,
    isMinimized: false,
    zIndex: 0,
    position: { x: 320, y: 200 },
  },
  {
    id: "experiences",
    title: "Experiences",
    isOpen: false,
    isMinimized: false,
    zIndex: 0,
    position: { x: 108, y: 48 },
  },
  {
    id: "music",
    title: "Music Player",
    isOpen: false,
    isMinimized: false,
    zIndex: 0,
    position: { x: 1100, y: 200 },
  },
];

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: initialWindows,
  nextZIndex: 1,
  booted: false,
  theme: "light",

  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    set({ theme });
  },

  setBoot: (booted) => set({ booted }),

  openWindow: (id) => {
    const { nextZIndex } = get();
    const defaultPos = getDefaultWindowPositions()[id];

    set((state) => ({
      nextZIndex: nextZIndex + 1,
      windows: state.windows.map((w) =>
        w.id === id
          ? {
              ...w,
              isOpen: true,
              isMinimized: false,
              zIndex: nextZIndex,
              ...(defaultPos ? { position: defaultPos } : {}),
            }
          : w
      ),
    }));
  },

  closeWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isOpen: false, isMinimized: false } : w
      ),
    })),

  minimizeWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMinimized: !w.isMinimized } : w
      ),
    })),

  focusWindow: (id) => {
    const { nextZIndex } = get();
    set((state) => ({
      nextZIndex: nextZIndex + 1,
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, zIndex: nextZIndex, isMinimized: false } : w
      ),
    }));
  },

  setWindowPosition: (id, position) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, position } : w
      ),
    })),

  getWindow: (id) => get().windows.find((w) => w.id === id),

  applyDesktopLayout: () => {
    const positions = getDefaultWindowPositions();

    set((state) => ({
      windows: state.windows.map((w) => {
        const pos = positions[w.id];
        return pos ? { ...w, position: pos } : w;
      }),
    }));
  },
}));
