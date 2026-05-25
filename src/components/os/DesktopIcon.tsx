"use client";

import { useCallback } from "react";
import Image from "next/image";
import { useWindowStore, type WindowId } from "@/store/useWindowStore";

const ICON_MAP: Record<WindowId, string> = {
  about: "/mac.svg",
  projects: "/box.svg",
  blog: "/notepad.svg",
  contact: "/mail.svg",
  terminal: "/terminal.svg",
  settings: "/settings.svg",
  experiences: "/globe.svg",
  music: "/music.svg",
};

interface DesktopIconProps {
  id: WindowId;
  label: string;
}

export default function DesktopIcon({ id, label }: DesktopIconProps) {
  const openWindow = useWindowStore((s) => s.openWindow);
  const focusWindow = useWindowStore((s) => s.focusWindow);

  const iconSrc = ICON_MAP[id];

  const activate = useCallback(() => {
    openWindow(id);
    focusWindow(id);
  }, [id, openWindow, focusWindow]);

  return (
    <button
      onClick={activate}
      className="group flex w-[72px] flex-col items-center p-1 text-center focus:outline-none sm:w-24 sm:gap-1 sm:p-2 cursor-pointer"
    >
      <div className="flex h-10 w-10 items-center justify-center transition-all group-hover:opacity-80 group-focus:opacity-80 sm:h-14 sm:w-14">
        <Image
          src={iconSrc}
          alt={`${label} icon`}
          width={40}
          height={40}
          className="h-8 w-8 sm:h-10 sm:w-10"
          style={{ filter: "var(--icon-invert)" }}
        />
      </div>
      <span className="text-[10px] font-medium leading-tight text-navy/70 group-hover:text-navy sm:text-xs">
        {label}
      </span>
    </button>
  );
}
