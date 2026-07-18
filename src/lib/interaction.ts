"use client";

import { useSyncExternalStore } from "react";

/**
 * Hover state bridge between the 3D scene and the DOM HUD.
 * SceneObject publishes what's under the cursor; ItemLabel renders the
 * game-style name tag. Kept outside React tree state so a hover never
 * re-renders the canvas.
 */
export interface HoverInfo {
  id: string;
  name: string;
}

let hovered: HoverInfo | null = null;
const listeners = new Set<() => void>();

export function setHoveredItem(info: HoverInfo) {
  hovered = info;
  listeners.forEach((l) => l());
}

export function clearHoveredItem(id: string) {
  if (hovered?.id === id) {
    hovered = null;
    listeners.forEach((l) => l());
  }
}

/** Imperative subscription for canvas-side hover-glow effects. */
export function subscribeHover(cb: (info: HoverInfo | null) => void) {
  const l = () => cb(hovered);
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useHoveredItem(): HoverInfo | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => hovered,
    () => null,
  );
}
