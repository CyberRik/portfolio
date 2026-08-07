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
      /* WRAPS. As a single nowrap row this is ~610px wide, and centring
         it with left-1/2 + -translate-x-1/2 put it at x -110..500 on a
         390px phone — Overview, Projects, About and Contact were all
         entirely offscreen and unreachable, Contact included. Width is
         therefore bounded by the viewport and the row is allowed to
         break onto a second line, so every entry is visible at any
         width. Not an overflow-x scroller: a horizontally scrollable
         strip hides the same entries behind a gesture with no affordance
         to say so, which is the bug again wearing a nicer coat. */
      className="absolute inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto flex w-fit max-w-[calc(100vw-1.5rem)] flex-wrap justify-center gap-x-1 gap-y-0.5 rounded-2xl border border-white/8 bg-black/30 px-2 py-1.5 backdrop-blur-md sm:bottom-6 sm:max-w-none sm:flex-nowrap sm:rounded-full"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: receded ? 0.15 : 1, y: 0 }}
      transition={{ duration: DUR.move, ease: EASE.out }}
    >
      {ENTRIES.map((e) => (
        <button
          key={e.label}
          onClick={() => flyToView(e.view, undefined, e.meta)}
          className={`rounded-full px-2.5 py-1.5 font-mono text-[10.5px] tracking-wider transition-colors hover:bg-white/10 hover:text-[#ffd9a8] sm:px-3 sm:py-1 sm:text-[11px] ${
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
