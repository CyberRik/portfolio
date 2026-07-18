"use client";

import { motion } from "framer-motion";
import { CAMERA_VIEWS, type CameraViewId } from "@/config/camera.config";
import { flyToView } from "@/components/camera/cameraBus";

const VIEWS = Object.keys(CAMERA_VIEWS) as CameraViewId[];

/**
 * Quiet dock for the named camera views. Proves the flyTo pipeline
 * end-to-end; Phase 2 object focus reuses the exact same bus.
 */
export function ViewDock() {
  return (
    <motion.nav
      className="absolute bottom-6 left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-full border border-white/8 bg-black/30 px-2 py-1.5 backdrop-blur-md"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.6, duration: 0.8, ease: "easeOut" }}
    >
      {VIEWS.map((id) => (
        <button
          key={id}
          onClick={() => flyToView(id)}
          className="rounded-full px-3 py-1 font-mono text-[11px] tracking-wider text-[#b8a890] capitalize transition-colors hover:bg-white/10 hover:text-[#ffd9a8]"
        >
          {id}
        </button>
      ))}
    </motion.nav>
  );
}
