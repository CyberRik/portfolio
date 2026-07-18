"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useFocusState } from "@/lib/focus";

/**
 * Cinematic lower-third. Appears only after the camera has settled on
 * a subject AND held for a beat — the room gets its moment first.
 */
const DWELL_MS = 700;

export function FocusCaption() {
  const focus = useFocusState();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (focus.phase !== "arrived") {
      setRevealed(false);
      return;
    }
    const t = setTimeout(() => setRevealed(true), DWELL_MS);
    return () => clearTimeout(t);
  }, [focus.phase, focus.id]);

  const show = revealed && focus.phase === "arrived" && focus.name;

  return (
    <div className="pointer-events-none absolute bottom-24 left-10 z-40">
      <AnimatePresence>
        {show && (
          <motion.div
            key={focus.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6, transition: { duration: 0.35, ease: "easeIn" } }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="mb-3 h-px w-10 bg-[#ffb361]"
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            />
            <p className="font-mono text-lg tracking-[0.3em] text-[#e8ddc8] uppercase">
              {focus.name}
            </p>
            <motion.p
              className="mt-2 font-mono text-[10px] tracking-[0.25em] text-[#7a6f5c] uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              esc — pull back
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
