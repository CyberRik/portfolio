"use client";

import { materials, emissive } from "@/lib/materials";
import { Cyl } from "./primitives";
import { SceneObject } from "@/lib/interactive/SceneObject";
import { ROOM } from "@/components/scene/Room";

/**
 * Ceiling pendant over the desk — the visible fixture for the warm
 * practical pool (the actual spotlight lives in Lighting.tsx, aimed
 * from just under this shade).
 */
export function PendantLamp() {
  const y = ROOM.height;
  return (
    <SceneObject def={{ id: "pendant-lamp", name: "Pendant Lamp" }} position={[0, 0, -1.5]}>
      {/* Ceiling rose + drop cable */}
      <Cyl position={[0, y - 0.015, 0]} scale={[0.06, 0.03, 0.06]} material={materials.metalDark} />
      <Cyl position={[0, y - 0.22, 0]} scale={[0.008, 0.42, 0.008]} material={materials.rubber} />
      {/* Shade — spun aluminum dome */}
      <mesh position={[0, y - 0.48, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.21, 0.17, 28, 1, true]} />
        <primitive object={materials.metalDark} attach="material" />
      </mesh>
      <Cyl position={[0, y - 0.405, 0]} scale={[0.09, 0.02, 0.09]} material={materials.metalDark} />
      {/* Warm bulb face, visible from below */}
      <mesh position={[0, y - 0.555, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 28]} />
        <primitive object={emissive("#ffd9a8", 1.9)} attach="material" />
      </mesh>
    </SceneObject>
  );
}
