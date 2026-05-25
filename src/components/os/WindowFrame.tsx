"use client";

import {
  type ReactNode,
  useEffect,
  useState,
  useSyncExternalStore,
  startTransition,
} from "react";
import { motion } from "framer-motion";
import { useWindowStore, type WindowId } from "@/store/useWindowStore";

interface WindowFrameProps {
  id: WindowId;
  children: ReactNode;
  width?: number;
  height?: number;
}

const MOBILE_QUERY = "(max-width: 639px)";

function subscribeMobileQuery(onChange: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getMobileSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function useIsMobile() {
  return useSyncExternalStore(
    subscribeMobileQuery,
    getMobileSnapshot,
    () => false
  );
}

export default function WindowFrame({
  id,
  children,
  width = 560,
  height = 420,
}: WindowFrameProps) {
  const win = useWindowStore((s) => s.windows.find((w) => w.id === id));
  const storeX = win?.position.x;
  const storeY = win?.position.y;
  const isOpen = win?.isOpen ?? false;
  const windows = useWindowStore((s) => s.windows);
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const setWindowPosition = useWindowStore((s) => s.setWindowPosition);
  const isMobile = useIsMobile();

  const [size, setSize] = useState({ width, height });
  const [pos, setPos] = useState({ x: 80, y: 60 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [prevSize, setPrevSize] = useState({ width, height });
  const [prevPos, setPrevPos] = useState({ x: 80, y: 60 });

  useEffect(() => {
    if (storeX === undefined || storeY === undefined) return;

    const position = { x: storeX, y: storeY };
    startTransition(() => {
      setPos(position);
      setPrevPos(position);
    });
  }, [storeX, storeY]);

  useEffect(() => {
    if (id !== "about" || !isOpen) return;
    if (storeX !== 80 || storeY !== 60) return;

    const centerX = Math.max(0, (window.innerWidth - size.width) / 2);
    const centerY = Math.max(0, (window.innerHeight - size.height) / 2);
    const centered = { x: centerX, y: centerY };

    startTransition(() => {
      setPos(centered);
      setPrevPos(centered);
      setWindowPosition("about", centered);
    });
  }, [id, isOpen, storeX, storeY, size.width, size.height, setWindowPosition]);

  if (!win || !win.isOpen) return null;

  const openWindows = windows.filter((w) => w.isOpen && !w.isMinimized);
  const isFocused =
    openWindows.length > 0 &&
    win.zIndex === Math.max(...openWindows.map((w) => w.zIndex));

  const minWidth = 280;
  const minHeight = 180;

  const handleTitleBarPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;

    e.preventDefault();
    focusWindow(id);
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = pos.x;
    const startPosY = pos.y;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      const nextY = Math.max(0, startPosY + dy);
      const nextX = startPosX + dx;

      setPos({ x: nextX, y: nextY });
      if (isMaximized) setIsMaximized(false);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);

      const nextY = Math.max(0, startPosY + (upEvent.clientY - startY));
      const nextX = startPosX + (upEvent.clientX - startX);
      setWindowPosition(id, { x: nextX, y: nextY });
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  const handleResizePointerDown = (e: React.PointerEvent, dir: string) => {
    e.preventDefault();
    e.stopPropagation();
    focusWindow(id);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;
    const startPosX = pos.x;
    const startPosY = pos.y;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startPosX;
      let newY = startPosY;

      if (dir.includes("e")) {
        newWidth = Math.max(minWidth, startWidth + dx);
      }
      if (dir.includes("w")) {
        const potentialWidth = startWidth - dx;
        if (potentialWidth >= minWidth) {
          newWidth = potentialWidth;
          newX = startPosX + dx;
        }
      }
      if (dir.includes("s")) {
        newHeight = Math.max(minHeight, startHeight + dy);
      }
      if (dir.includes("n")) {
        const potentialHeight = startHeight - dy;
        if (potentialHeight >= minHeight) {
          newHeight = potentialHeight;
          newY = Math.max(0, startPosY + dy);
        }
      }

      setSize({ width: newWidth, height: newHeight });
      setPos({ x: newX, y: newY });
      if (isMaximized) setIsMaximized(false);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);

      const dx = upEvent.clientX - startX;
      const dy = upEvent.clientY - startY;
      let newX = startPosX;
      let newY = startPosY;

      if (dir.includes("w")) {
        const potentialWidth = startWidth - dx;
        if (potentialWidth >= minWidth) {
          newX = startPosX + dx;
        }
      }
      if (dir.includes("n")) {
        const potentialHeight = startHeight - dy;
        if (potentialHeight >= minHeight) {
          newY = Math.max(0, startPosY + dy);
        }
      }

      setWindowPosition(id, { x: newX, y: newY });
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  const toggleMaximize = () => {
    if (isMaximized) {
      setSize(prevSize);
      setPos(prevPos);
      setWindowPosition(id, prevPos);
      setIsMaximized(false);
    } else {
      setPrevSize(size);
      setPrevPos(pos);
      const newW = window.innerWidth - 20;
      const newH = window.innerHeight - 60;
      const maximizedPos = { x: 10, y: 10 };
      setSize({ width: newW, height: newH });
      setPos(maximizedPos);
      setWindowPosition(id, maximizedPos);
      setIsMaximized(true);
    }
  };

  if (isMobile) {
    return (
      <motion.div
        className="fixed inset-0 bottom-10"
        style={{ zIndex: win.zIndex }}
        initial={{ y: "100%", opacity: 0 }}
        animate={{
          y: win.isMinimized ? "100%" : 0,
          opacity: win.isMinimized ? 0 : 1,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onPointerDown={() => focusWindow(id)}
      >
        <div className="flex h-full flex-col border border-navy bg-canvas">
          <div className="relative flex h-10 shrink-0 items-center justify-between border-b border-navy bg-canvas px-2 select-none">
            <div className="z-10 flex items-center justify-start gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeWindow(id);
                }}
                className="flex h-8 w-8 items-center justify-center"
                title="Close"
              >
                <div className="flex h-4.5 w-4.5 items-center justify-center border border-navy bg-canvas hover:bg-navy/10 active:bg-navy">
                  <svg width="7" height="7" viewBox="0 0 7 7" className="text-navy">
                    <line x1="1" y1="1" x2="6" y2="6" stroke="currentColor" strokeWidth="1.2" />
                    <line x1="6" y1="1" x2="1" y2="6" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  minimizeWindow(id);
                }}
                className="flex h-8 w-8 items-center justify-center"
                title="Minimize"
              >
                <div className="flex h-4.5 w-4.5 items-center justify-center border border-navy bg-canvas hover:bg-navy/10 active:bg-navy">
                  <div className="w-2 h-[2px] bg-navy" />
                </div>
              </button>
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="font-sans text-[12px] font-bold text-navy">
                {win.title}
              </span>
            </div>

            <div className="z-10 w-16" />
          </div>

          <div className="flex-1 overflow-auto p-3 bg-canvas">{children}</div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed select-none"
      style={{
        zIndex: win.zIndex,
        width: size.width,
        height: size.height,
        left: pos.x,
        top: pos.y,
        pointerEvents: win.isMinimized ? "none" : "auto",
      }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{
        scale: win.isMinimized ? 0.9 : 1,
        opacity: win.isMinimized ? 0 : 1,
      }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      onPointerDown={() => focusWindow(id)}
    >
      <div className="flex h-full w-full flex-col border border-navy bg-canvas p-[1px]">
        <div className="flex flex-1 flex-col border border-navy bg-canvas overflow-hidden relative">
          <div
            onPointerDown={handleTitleBarPointerDown}
            className="relative flex h-6 shrink-0 cursor-grab items-center justify-between border-b border-navy bg-canvas px-2 select-none active:cursor-grabbing"
          >
            <div className="z-10 flex w-18 items-center justify-start gap-1.5">
              {isFocused && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeWindow(id);
                    }}
                    className="flex h-3.5 w-3.5 items-center justify-center border border-navy bg-canvas hover:bg-navy/10 active:bg-navy"
                    title="Close"
                  >
                    <svg width="6" height="6" viewBox="0 0 6 6" className="text-navy">
                      <line x1="0" y1="0" x2="6" y2="6" stroke="currentColor" strokeWidth="1" />
                      <line x1="6" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="1" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      minimizeWindow(id);
                    }}
                    className="flex h-3.5 w-3.5 items-center justify-center border border-navy bg-canvas hover:bg-navy/10 active:bg-navy"
                    title="Minimize"
                  >
                    <div className="w-1.5 h-[2px] bg-navy" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMaximize();
                    }}
                    className="relative flex h-3.5 w-3.5 items-center justify-center border border-navy bg-canvas hover:bg-navy/10 active:bg-navy"
                    title="Zoom"
                  >
                    <span className="relative h-[9px] w-[9px] border border-navy bg-canvas">
                      <span className="absolute -right-[3px] -top-[3px] h-[5px] w-[5px] border-b border-l border-navy bg-canvas" />
                    </span>
                  </button>
                </>
              )}
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              {isFocused && (
                <div
                  className="absolute left-[72px] right-2 top-[5px] bottom-[5px]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(to bottom, var(--color-navy), var(--color-navy) 1px, transparent 1px, transparent 3px)",
                  }}
                />
              )}
              <span className="relative z-10 bg-canvas px-2 font-sans text-[11px] font-bold text-navy">
                {win.title}
              </span>
            </div>

            <div className="z-10 w-18" />
          </div>

          <div className="flex-1 overflow-auto p-4 relative bg-canvas select-text">
            {children}
          </div>

          {isFocused && (
            <div
              onPointerDown={(e) => handleResizePointerDown(e, "se")}
              className="absolute bottom-[1px] right-[1px] h-3.5 w-3.5 cursor-nwse-resize z-[51] bg-canvas flex items-end justify-end border-t border-l border-navy"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" className="text-navy pointer-events-none">
                <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1" />
                <line x1="10" y1="4" x2="4" y2="10" stroke="currentColor" strokeWidth="1" />
                <line x1="10" y1="7" x2="7" y2="10" stroke="currentColor" strokeWidth="1" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {isFocused && (
        <>
          <div
            onPointerDown={(e) => handleResizePointerDown(e, "n")}
            className="absolute top-0 left-1.5 right-1.5 h-1.5 -translate-y-1/2 cursor-ns-resize z-50"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown(e, "s")}
            className="absolute bottom-0 left-1.5 right-1.5 h-1.5 translate-y-1/2 cursor-ns-resize z-50"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown(e, "w")}
            className="absolute left-0 top-1.5 bottom-1.5 w-1.5 -translate-x-1/2 cursor-ew-resize z-50"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown(e, "e")}
            className="absolute right-0 top-1.5 bottom-1.5 w-1.5 translate-x-1/2 cursor-ew-resize z-50"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown(e, "nw")}
            className="absolute top-0 left-0 w-3 h-3 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize z-50"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown(e, "ne")}
            className="absolute top-0 right-0 w-3 h-3 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize z-50"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown(e, "sw")}
            className="absolute bottom-0 left-0 w-3 h-3 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize z-50"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown(e, "se")}
            className="absolute bottom-0 right-0 w-3 h-3 translate-x-1/2 translate-y-1/2 cursor-nwse-resize z-50"
          />
        </>
      )}
    </motion.div>
  );
}
