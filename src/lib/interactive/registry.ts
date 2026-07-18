import type { InteractiveObjectDef } from "./types";

/**
 * Module-level registry of interactive objects.
 * Objects self-register at mount via <SceneObject/>. Phase 2 subscribes
 * to this to build hover/click/focus behavior without touching the scene graph.
 */
type Listener = (defs: ReadonlyMap<string, InteractiveObjectDef>) => void;

const defs = new Map<string, InteractiveObjectDef>();
const listeners = new Set<Listener>();

function emit() {
  const snapshot: ReadonlyMap<string, InteractiveObjectDef> = new Map(defs);
  listeners.forEach((l) => l(snapshot));
}

export const interactiveRegistry = {
  register(def: InteractiveObjectDef) {
    defs.set(def.id, def);
    emit();
    return () => {
      defs.delete(def.id);
      emit();
    };
  },
  get(id: string) {
    return defs.get(id);
  },
  getAll(): ReadonlyMap<string, InteractiveObjectDef> {
    return new Map(defs);
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
