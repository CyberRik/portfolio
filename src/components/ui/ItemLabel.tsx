"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useHoveredItem } from "@/lib/interaction";
import { useFocusState } from "@/lib/focus";

/**
 * Game-style item tag that trails the cursor while an interactive
 * object is hovered. Pure DOM — never touches the render loop.
 */
export function ItemLabel() {
  const hovered = useHoveredItem();
  const focus = useFocusState();
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      className="pointer-events-none fixed z-50"
      style={{ left: pos.x + 18, top: pos.y + 6 }}
    >
      <AnimatePresence>
        {/* only while exploring — during flights and staged holds the
            lower-third caption owns the typography */}
        {hovered && focus.phase === "idle" && (
          <motion.div
            key={hovered.id}
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex items-center gap-2 rounded-md border border-[#ffd9a8]/25 bg-black/65 px-3 py-1.5 backdrop-blur-md"
          >
            <span className="block h-1.5 w-1.5 rotate-45 bg-[#ffb361]" />
            <span className="font-mono text-[11px] tracking-[0.18em] text-[#ffd9a8] uppercase">
              {hovered.name}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
