"use client";

import { useSyncExternalStore } from "react";

/**
 * Cinematic staging state. The CameraRig drives it:
 *   idle    — free exploration
 *   flying  — mid-flight (UI recedes)
 *   arrived — camera settled on a subject (after a dwell beat, the
 *             lower-third caption is allowed to appear)
 */
export type FocusPhase = "idle" | "flying" | "arrived";

export interface FocusState {
  phase: FocusPhase;
  id: string | null;
  name: string | null;
}

let state: FocusState = { phase: "idle", id: null, name: null };
const listeners = new Set<() => void>();

function set(next: FocusState) {
  state = next;
  listeners.forEach((l) => l());
}

export const focusStore = {
  flying(id?: string, name?: string) {
    set({ phase: "flying", id: id ?? null, name: name ?? null });
  },
  arrived() {
    if (state.phase === "flying") set({ ...state, phase: "arrived" });
  },
  clear() {
    set({ phase: "idle", id: null, name: null });
  },
  get: () => state,
};

export function useFocusState(): FocusState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
}
