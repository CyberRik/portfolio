"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { usePortalSection } from "@/lib/portal";

/**
 * Pause the R3F render loop when a fullscreen DOM portal is active.
 *
 * "Skills", "experience", "achievements", "about" and "contact" all
 * render an opaque DOM overlay that completely hides the 3D canvas, yet
 * the canvas keeps doing full scene draws, post-processing, shadow
 * passes, dust-particle advection and camera-rig math behind it — pure
 * waste that competes with the DOM overlay's own paint budget, causing
 * the jank the user noticed in Skills.
 *
 * "projects" is the exception: it renders ON the in-scene monitor, so
 * the canvas must stay live for that one.
 *
 * Switching `frameloop` to `"never"` stops requestAnimationFrame
 * entirely. On close we flip back to `"always"` and force one
 * `invalidate()` to kick the loop awake immediately — without the
 * invalidate the first frame after resumption can wait up to 16 ms
 * for the next rAF callback, which reads as a visible stutter.
 */

const DOM_PORTALS = new Set(["experience", "skills", "achievements", "about", "contact"]);

export function PortalSuspend() {
  const section = usePortalSection();
  const set = useThree((s) => s.set);
  const invalidate = useThree((s) => s.invalidate);
  const paused = useRef(false);

  useEffect(() => {
    const shouldPause = section !== null && DOM_PORTALS.has(section);

    if (shouldPause && !paused.current) {
      set({ frameloop: "never" });
      paused.current = true;
    } else if (!shouldPause && paused.current) {
      paused.current = false;
      set({ frameloop: "always" });
      invalidate(); // kick the loop awake immediately
    }
  }, [section, set, invalidate]);

  // cleanup: always restore the loop if unmounted while paused
  useEffect(() => {
    return () => {
      if (paused.current) {
        set({ frameloop: "always" });
      }
    };
  }, [set]);

  return null;
}
