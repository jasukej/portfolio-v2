"use client";

import { motion } from "framer-motion";

export default function MobileUnavailable() {
  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center gap-6 bg-canvas px-8 text-center">
      <motion.img
        src="/fish.svg"
        alt=""
        width={128}
        height={128}
        className="h-24 w-24 [image-rendering:pixelated]"
        animate={{ x: [-14, 14, -14] }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="max-w-xs space-y-2">
        <p className="font-sans text-sm font-bold tracking-tight text-navy">
          Not available on this device
        </p>
        <p className="font-mono text-[11px] leading-relaxed text-navy/60">
          Mobile displays are currently a work-in-progress :(
          Please re-open this site on a laptop or desktop browser.
        </p>
      </div>
    </div>
  );
}
