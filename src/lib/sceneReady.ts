"use client";

import { useSyncExternalStore } from "react";

/**
 * "First real frame" gate. drei's useProgress only tracks asset
 * downloads — shaders still compile and shadows still bake during the
 * first rendered frames, which looks like the scene assembling itself.
 * The ReadyProbe (inside the canvas) marks ready only after the world
 * has actually rendered a run of warm frames.
 */
let ready = false;
const listeners = new Set<() => void>();

export function markSceneReady() {
  if (ready) return;
  ready = true;
  listeners.forEach((l) => l());
}

export function useSceneReady(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => ready,
    () => false,
  );
}
