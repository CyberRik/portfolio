"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { usePopOut, usePortalSection } from "@/lib/portal";

/**
 * Pause the R3F render loop when a portal is active.
 *
 * "Skills", "experience", "achievements", "about" and "contact" all
 * render an opaque DOM overlay that completely hides the 3D canvas, yet
 * the canvas keeps doing full scene draws, post-processing, shadow
 * passes, dust-particle advection and camera-rig math behind it — pure
 * waste that competes with the DOM overlay's own paint budget, causing
 * the jank the user noticed in Skills.
 *
 * "projects" also freezes — but after a delay. It renders ON the
 * monitor via drei's <Html transform>, so the canvas must stay live
 * during the camera's dive flight. Once the camera settles and the
 * HTML desktop is showing, the 3D scene behind it is invisible: the
 * monitor body, desk lamp, and room are all outside the narrow viewport
 * or occluded by the DOM surface. At that point the full scene draw,
 * post-processing, dust particles, and camera micro-motion are pure
 * GPU waste. Freezing the loop drops GPU utilization to near zero
 * while the user browses the DOM desktop — clicks, scrolls, and
 * animations continue to work because they are pure DOM, not WebGL.
 *
 * The delay (PROJECTS_FREEZE_DELAY) covers the portal's 1.4s camera
 * dive plus settle time, so the freeze happens well after the last
 * visible 3D motion. On close, the loop resumes synchronously
 * BEFORE the return flight starts (section → null fires the unpause
 * effect, then closePortal's flyToView is processed on the next rAF).
 *
 * Switching `frameloop` to `"never"` stops requestAnimationFrame
 * entirely. On close we flip back to `"always"` and force one
 * `invalidate()` to kick the loop awake immediately — without the
 * invalidate the first frame after resumption can wait up to 16 ms
 * for the next rAF callback, which reads as a visible stutter.
 */

const DOM_PORTALS = new Set(["experience", "skills", "achievements", "about", "contact"]);

/**
 * How long after the projects portal opens before freezing the canvas.
 * Covers the 1.4s camera dive + HTML mount + a comfort buffer.
 */
const PROJECTS_FREEZE_DELAY = 2200;

export function PortalSuspend() {
  const section = usePortalSection();
  const popOut = usePopOut();
  const set = useThree((s) => s.set);
  const invalidate = useThree((s) => s.invalidate);
  const paused = useRef(false);

  useEffect(() => {
    const isDom = (section !== null && DOM_PORTALS.has(section)) || popOut;
    const isProjects = section === "projects" && !popOut;

    // --- DOM portals or PopOut mode: freeze immediately ---
    if (isDom && !paused.current) {
      set({ frameloop: "never" });
      paused.current = true;
      return;
    }

    // --- Projects: freeze after the camera dive settles ---
    if (isProjects && !paused.current) {
      const timer = setTimeout(() => {
        if (!paused.current) {
          set({ frameloop: "never" });
          paused.current = true;
        }
      }, PROJECTS_FREEZE_DELAY);
      // If the portal closes before the timer fires, cancel it
      return () => clearTimeout(timer);
    }

    // --- Any portal closed (or switching sections): resume ---
    if (!isDom && !isProjects && paused.current) {
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
