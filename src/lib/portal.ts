"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether a portal experience currently owns the frame. Set by the
 * ExperienceOverlay; consumed by in-scene UI (waypoint beacons) that
 * must vanish while a world is open.
 */
let open = false;
const listeners = new Set<() => void>();

export function setPortalOpen(v: boolean) {
  if (open === v) return;
  open = v;
  listeners.forEach((l) => l());
}

export function usePortalOpen(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => open,
    () => open,
  );
}
