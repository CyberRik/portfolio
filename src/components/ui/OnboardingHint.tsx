"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useFocusState } from "@/lib/focus";
import { useCoarsePointer } from "@/lib/interaction";
import { usePortalSection } from "@/lib/portal";

export function OnboardingHint() {
  const focus = useFocusState();
  const portalOpen = usePortalSection() !== null;
  // "click" is wrong on a phone, and this is the one string that tells a
  // first-time visitor how the whole scene works.
  const coarse = useCoarsePointer();

  // Show whenever sitting idle in the wide shot, allowing the 3.5s delay to trigger each time they return.
  const show = focus.phase === "idle" && !portalOpen;

  return (
    // Sits above the dock, which wraps to two rows on a phone — the old
    // flat bottom-16 cleared a one-row dock only, so on mobile the hint
    // landed on top of it.
    <div className="pointer-events-none absolute inset-x-0 bottom-28 z-30 flex justify-center px-4 sm:bottom-16">
      <AnimatePresence>
        {show && (
          <motion.p
            key="hint"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            transition={{ delay: 3.5, duration: 1.5, ease: "easeInOut" }}
            // Tracking is the thing that has to give on a narrow screen:
            // at 0.3em this string is ~430px and wrapped, orphaning the
            // closing bracket onto its own line.
            className="text-center font-mono text-[9px] tracking-[0.15em] text-[#a89880]/70 uppercase sm:text-[10px] sm:tracking-[0.3em]"
          >
            [ drag to orbit · {coarse ? "tap" : "click"} beacons to explore ]
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
