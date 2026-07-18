"use client";

import { useEffect, type ReactNode } from "react";
import type { ThreeElements } from "@react-three/fiber";
import { interactiveRegistry } from "./registry";
import type { InteractiveObjectDef } from "./types";

type SceneObjectProps = ThreeElements["group"] & {
  def: InteractiveObjectDef;
  children: ReactNode;
};

/**
 * Wrapper every future-interactive object mounts inside.
 * Today: registers the object and names the group.
 * Phase 2: hover/click handlers, outline highlighting and camera focus
 * attach HERE — object components never change.
 */
export function SceneObject({ def, children, ...groupProps }: SceneObjectProps) {
  useEffect(() => interactiveRegistry.register(def), [def]);

  return (
    <group name={`interactive:${def.id}`} {...groupProps}>
      {children}
    </group>
  );
}
