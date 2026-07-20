"use client";

import { materials } from "@/lib/materials";
import { Bx } from "./primitives";
import { SceneObject } from "@/lib/interactive/SceneObject";
import { ROOM } from "@/components/scene/Room";

/**
 * Window on the back wall — frame, mullion, sill and glass.
 * The city itself lives on the Exterior panorama cylinder, so the view
 * through the glass parallaxes correctly and the same skyline surrounds
 * the diorama when the camera pulls out.
 */
export function CityWindow() {
  const { window: win } = ROOM;
  const halfD = ROOM.depth / 2;

  return (
    <SceneObject def={{ id: "window", name: "Window", cameraView: "window" }}>
      <group position={[0, win.centerY, -halfD]}>
        <Bx position={[0, win.height / 2 + 0.04, 0]} scale={[win.width + 0.16, 0.08, 0.18]} material={materials.windowFrame} />
        <Bx position={[0, -win.height / 2 - 0.04, 0]} scale={[win.width + 0.16, 0.08, 0.18]} material={materials.windowFrame} />
        <Bx position={[-win.width / 2 - 0.04, 0, 0]} scale={[0.08, win.height + 0.16, 0.18]} material={materials.windowFrame} />
        <Bx position={[win.width / 2 + 0.04, 0, 0]} scale={[0.08, win.height + 0.16, 0.18]} material={materials.windowFrame} />
        {/* Center mullion */}
        <Bx position={[0, 0, 0]} scale={[0.04, win.height, 0.06]} material={materials.windowFrame} />
        {/* Sill */}
        <Bx position={[0, -win.height / 2 - 0.1, 0.12]} scale={[win.width + 0.3, 0.04, 0.3]} material={materials.woodDark} />

        {/* Glass */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[win.width, win.height]} />
          <primitive object={materials.glass} attach="material" />
        </mesh>
      </group>
    </SceneObject>
  );
}
