"use client";

import { useSyncExternalStore } from "react";
import type { Object3D } from "three";

/**
 * Imperative outline-selection store.
 *
 * We deliberately do NOT use @react-three/postprocessing's <Selection> /
 * <Select> context. In 3.0.4 the <Select> effect lists the context value
 * in its dependency array, and that value is a useMemo keyed on `selected`.
 * So the instant an enabled <Select> adds its meshes, `selected` changes →
 * the context identity changes → every enabled <Select> effect re-runs →
 * its cleanup removes the meshes and its body re-adds them → `selected`
 * changes again → infinite loop ("Maximum update depth exceeded") the
 * moment anything is hovered.
 *
 * Instead we hold the hovered objects here and feed them to <Outline>'s
 * imperative `selection` prop (its no-context branch), which just calls
 * `outline.selection.set(...)` once per change. No React state churn in
 * the render tree, no loop.
 */
let selected: Object3D[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function selectObject(obj: Object3D) {
  if (selected.includes(obj)) return;
  selected = [...selected, obj];
  emit();
}

export function deselectObject(obj: Object3D) {
  if (!selected.includes(obj)) return;
  selected = selected.filter((o) => o !== obj);
  emit();
}

export function useSelection(): Object3D[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => selected,
    () => selected,
  );
}
