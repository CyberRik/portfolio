"use client";

import type { Material } from "three";
import type { Vector3Tuple } from "three";
import { sharedBox, sharedCylinder } from "@/lib/materials";

interface PrimProps {
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale: Vector3Tuple;
  material: Material;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/**
 * Unit-box / unit-cylinder meshes scaled into shape.
 * One geometry instance serves the entire room.
 */
export function Bx({ castShadow = true, receiveShadow = true, material, ...p }: PrimProps) {
  return (
    <mesh
      geometry={sharedBox()}
      material={material}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      {...p}
    />
  );
}

export function Cyl({ castShadow = true, receiveShadow = true, material, ...p }: PrimProps) {
  return (
    <mesh
      geometry={sharedCylinder()}
      material={material}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      {...p}
    />
  );
}
