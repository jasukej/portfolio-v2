"use client";

import { useEffect, useRef } from "react";
import { useWindowStore, type WindowId } from "@/store/useWindowStore";
import { WINDOW_DIMENSIONS } from "@/lib/desktop-layout";
import { DESKTOP_ICONS_LEFT, DESKTOP_ICONS_RIGHT } from "@/data/desktop";
import LoadingScreen from "./LoadingScreen";
import Taskbar from "./Taskbar";
import MenuBar from "./MenuBar";
import DesktopIcon from "./DesktopIcon";
import WindowFrame from "./WindowFrame";
import AboutContent from "../windows/AboutContent";
import ProjectsContent from "../windows/ProjectsContent";
import BlogContent from "../windows/BlogContent";
import ContactContent from "../windows/ContactContent";
import TerminalContent from "../windows/TerminalContent";
import SettingsContent from "../windows/SettingsContent";
import ExperiencesContent from "../windows/ExperiencesContent";
import MusicContent from "../windows/MusicContent";
import { type ReactNode } from "react";

const WINDOW_CONTENT: Record<WindowId, ReactNode> = {
  about: <AboutContent />,
  projects: <ProjectsContent />,
  blog: <BlogContent />,
  experiences: <ExperiencesContent />,
  music: <MusicContent />,
  contact: <ContactContent />,
  terminal: <TerminalContent />,
  settings: <SettingsContent />,
};

export default function Desktop() {
  const booted = useWindowStore((s) => s.booted);
  const windows = useWindowStore((s) => s.windows);
  const applyDesktopLayout = useWindowStore((s) => s.applyDesktopLayout);
  const layoutAppliedRef = useRef(false);

  useEffect(() => {
    if (!booted || layoutAppliedRef.current) return;
    layoutAppliedRef.current = true;
    applyDesktopLayout();
  }, [booted, applyDesktopLayout]);

  return (
    <>
      <LoadingScreen />

      {booted && (
        <div id="desktop-canvas" className="relative h-screen w-screen bg-canvas">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(var(--color-navy) 1px, transparent 1px), linear-gradient(90deg, var(--color-navy) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="absolute left-0 right-14 top-9 flex flex-row flex-wrap justify-center gap-1 px-3 sm:left-6 sm:right-auto sm:top-12 sm:flex-col sm:flex-nowrap sm:justify-start sm:gap-2 sm:px-0">
            {DESKTOP_ICONS_LEFT.map((icon) => (
              <DesktopIcon key={icon.id} id={icon.id} label={icon.label} />
            ))}
          </div>

          <div className="absolute right-3 top-9 flex flex-col items-center gap-1 sm:right-6 sm:top-12 sm:gap-2">
            {DESKTOP_ICONS_RIGHT.map((icon) => (
              <DesktopIcon key={icon.id} id={icon.id} label={icon.label} />
            ))}
          </div>

          <div className="pt-6">
            {windows
              .filter((w) => w.isOpen)
              .map((w) => (
                <WindowFrame
                  key={w.id}
                  id={w.id}
                  width={WINDOW_DIMENSIONS[w.id].width}
                  height={WINDOW_DIMENSIONS[w.id].height}
                >
                  {WINDOW_CONTENT[w.id]}
                </WindowFrame>
              ))}
          </div>

          <MenuBar />

          <Taskbar />
        </div>
      )}
    </>
  );
}
