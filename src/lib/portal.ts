"use client";

import { useSyncExternalStore } from "react";
import type { Vector3Tuple } from "three";
import { flyToPose, flyToView, setPortalDepth } from "@/components/camera/cameraBus";
import { CAMERA_VIEWS, type CameraViewId } from "@/config/camera.config";
import type { SectionId } from "@/content/portfolio";

/**
 * Which portal world currently owns the frame — the single source of
 * truth shared by the DOM overlay (fullscreen worlds), the in-scene
 * monitor desktop, and the waypoint beacons. Opening a portal also
 * stages the camera: depth floor relaxed, then a dive toward the
 * object (Projects gets a bespoke head-on pose so the physical screen
 * fills the frame and the room stays in your peripheral vision).
 */

interface Push {
  view: CameraViewId;
  /** how far along view→target the camera dives (smaller = deeper) */
  k: number;
  dur: number;
  /** explicit pose override — wins over view/k */
  pose?: { position: Vector3Tuple; target: Vector3Tuple };
}

const PORTAL_PUSH: Record<SectionId, Push> = {
  projects: {
    view: "desk",
    k: 1,
    dur: 1.4,
    // head-on with the panel, close enough that the 1.44m-wide ultrawide
    // fills nearly the full frame (~95% width at fov 42) — text is large
    // and legible, the room sits quietly in the periphery
    pose: { position: [0, 1.20, -1.35], target: [0, 1.20, -2.13] },
  },
  experience: { view: "whiteboard", k: 0.52, dur: 1.6 },
  skills: { view: "server", k: 0.5, dur: 1.6 },
  achievements: { view: "bookshelf", k: 0.55, dur: 1.6 },
  about: { view: "window", k: 0.45, dur: 1.9 },
  contact: { view: "desk", k: 0.75, dur: 1.3 },
};

let section: SectionId | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function openPortal(s: SectionId) {
  if (section === s) return;
  section = s;
  emit();
  setPortalDepth(true);
  const p = PORTAL_PUSH[s];
  const pose =
    p.pose ??
    (() => {
      const v = CAMERA_VIEWS[p.view];
      return {
        position: [
          v.target[0] + (v.position[0] - v.target[0]) * p.k,
          v.target[1] + (v.position[1] - v.target[1]) * p.k,
          v.target[2] + (v.position[2] - v.target[2]) * p.k,
        ] as Vector3Tuple,
        target: [...v.target] as Vector3Tuple,
      };
    })();
  flyToPose(pose.position, pose.target, p.dur);
}

export function closePortal() {
  if (!section) return;
  section = null;
  emit();
  setPortalDepth(false);
  flyToView("overview");
}

/** non-hook read for imperative call sites (scene pointer handlers) */
export function getPortalSection(): SectionId | null {
  return section;
}

export function usePortalSection(): SectionId | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => section,
    () => section,
  );
}
