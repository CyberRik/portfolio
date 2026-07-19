"use client";

import { motion } from "framer-motion";
import type { CameraViewId } from "@/config/camera.config";
import { flyToView, type FlightMeta } from "@/components/camera/cameraBus";
import { useFocusState } from "@/lib/focus";
import { DUR, EASE } from "@/lib/design";

/**
 * The portfolio's navigation, disguised as a camera dock. Each entry
 * flies to the room object that anchors a section and carries the
 * object's id as flight meta — on arrival the ContentPanel keys off it
 * and reveals the section. Overview carries no meta: it's the way out.
 */
interface DockEntry {
  label: string;
  view: CameraViewId;
  meta?: FlightMeta;
}

const ENTRIES: DockEntry[] = [
  { label: "Overview", view: "overview" },
  { label: "Projects", view: "desk", meta: { id: "monitor", name: "Projects" } },
  { label: "Experience", view: "whiteboard", meta: { id: "whiteboard", name: "Experience" } },
  { label: "Skills", view: "server", meta: { id: "server-rack", name: "Technical Skills" } },
  { label: "Achievements", view: "bookshelf", meta: { id: "bookshelf", name: "Achievements" } },
  // About reads over the wide shot — the room itself is the "about";
  // the night window (its click anchor) is too dark to sit behind text
  { label: "About", view: "overview", meta: { id: "window", name: "About" } },
  { label: "Contact", view: "desk", meta: { id: "laptop", name: "Contact" } },
];

/**
 * Quiet dock. Recedes while the camera is in flight or holding on a
 * subject — the frame belongs to the room.
 */
export function ViewDock() {
  const focus = useFocusState();
  const receded = focus.phase === "flying";

  return (
    <motion.nav
      className="absolute bottom-6 left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-full border border-white/8 bg-black/30 px-2 py-1.5 backdrop-blur-md"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: receded ? 0.15 : 1, y: 0 }}
      transition={{ duration: DUR.move, ease: EASE.out }}
    >
      {ENTRIES.map((e) => (
        <button
          key={e.label}
          onClick={() => flyToView(e.view, undefined, e.meta)}
          className={`rounded-full px-3 py-1 font-mono text-[11px] tracking-wider transition-colors hover:bg-white/10 hover:text-[#ffd9a8] ${
            focus.phase === "arrived" && focus.id === e.meta?.id
              ? "text-[#ffd9a8]"
              : "text-[#b8a890]"
          }`}
        >
          {e.label}
        </button>
      ))}
    </motion.nav>
  );
}
