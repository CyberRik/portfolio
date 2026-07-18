"use client";

import { materials } from "@/lib/materials";
import { Bx } from "./primitives";
import { SceneObject } from "@/lib/interactive/SceneObject";

export const DESK = {
  /** top surface height */
  surfaceY: 0.75,
  center: [0, 0, -1.9] as const,
  width: 2.6,
  depth: 1.1,
} as const;

export function Desk() {
  const { surfaceY, width, depth } = DESK;
  const legInset = 0.12;

  return (
    <SceneObject
      def={{ id: "desk", name: "Desk", cameraView: "desk" }}
      position={[DESK.center[0], 0, DESK.center[2]]}
    >
      {/* Top slab with a slightly thicker front edge profile */}
      <Bx position={[0, surfaceY - 0.025, 0]} scale={[width, 0.05, depth]} material={materials.deskTop} />
      <Bx position={[0, surfaceY - 0.07, depth / 2 - 0.02]} scale={[width, 0.04, 0.04]} material={materials.deskTop} />

      {/* Steel legs */}
      {([-1, 1] as const).map((sx) => (
        <group key={sx} position={[sx * (width / 2 - legInset), 0, 0]}>
          <Bx position={[0, (surfaceY - 0.05) / 2, depth / 2 - 0.1]} scale={[0.05, surfaceY - 0.05, 0.05]} material={materials.deskLeg} />
          <Bx position={[0, (surfaceY - 0.05) / 2, -depth / 2 + 0.1]} scale={[0.05, surfaceY - 0.05, 0.05]} material={materials.deskLeg} />
          <Bx position={[0, 0.08, 0]} scale={[0.06, 0.03, depth - 0.15]} material={materials.deskLeg} />
        </group>
      ))}

      {/* Cable tray */}
      <Bx position={[0, surfaceY - 0.14, -depth / 2 + 0.12]} scale={[width * 0.7, 0.08, 0.12]} material={materials.metalDark} />

      {/* Desk mat */}
      <Bx
        position={[0, surfaceY + 0.002, 0.12]}
        scale={[1.1, 0.004, 0.42]}
        material={materials.fabric}
        castShadow={false}
      />
    </SceneObject>
  );
}
