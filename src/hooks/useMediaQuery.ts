"use client";

import { useSyncExternalStore } from "react";

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

export const NARROW_VIEWPORT_QUERY = "(max-width: 1023px)";

export function useIsNarrowViewport() {
  return useMediaQuery(NARROW_VIEWPORT_QUERY);
}
