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

/**
 * True on touch-primary devices.
 *
 * Exists so copy can say "tap" where there is no cursor to click with.
 * Read through useSyncExternalStore with a `false` server snapshot
 * rather than a useEffect flag: the hint renders inside a delayed
 * AnimatePresence, and a post-mount state flip would swap the wording
 * out from under a fade that is already running.
 *
 * Subscribed rather than sampled once because the query genuinely
 * changes — plugging a mouse into a tablet, or Chrome devtools device
 * emulation, both flip it live.
 */
const COARSE = "(pointer: coarse)";

/**
 * Non-hook form, for module-level code that runs outside React (the
 * portal store decides pop-out state inside a plain function call).
 * Returns false during prerender, where there is no matchMedia.
 */
export function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.(COARSE).matches ?? false;
}

export function useCoarsePointer(): boolean {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const mq = window.matchMedia(COARSE);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia?.(COARSE).matches ?? false,
    () => false,
  );
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
