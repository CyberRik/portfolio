"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useFocusState } from "@/lib/focus";
import { usePortalSection } from "@/lib/portal";

export function OnboardingHint() {
  const focus = useFocusState();
  const portalOpen = usePortalSection() !== null;

  // Show whenever sitting idle in the wide shot, allowing the 3.5s delay to trigger each time they return.
  const show = focus.phase === "idle" && !portalOpen;

  return (
    <div className="pointer-events-none absolute bottom-16 left-0 right-0 z-30 flex justify-center">
      <AnimatePresence>
        {show && (
          <motion.p
            key="hint"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            transition={{ delay: 3.5, duration: 1.5, ease: "easeInOut" }}
            className="font-mono text-[10px] tracking-[0.3em] text-[#a89880]/70 uppercase text-center"
          >
            [ drag to orbit · click beacons to explore ]
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
