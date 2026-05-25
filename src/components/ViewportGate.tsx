"use client";

import { type ReactNode } from "react";
import { useIsNarrowViewport } from "@/hooks/useMediaQuery";
import MobileUnavailable from "./MobileUnavailable";

export default function ViewportGate({ children }: { children: ReactNode }) {
  const isNarrow = useIsNarrowViewport();

  if (isNarrow) return <MobileUnavailable />;

  return children;
}
