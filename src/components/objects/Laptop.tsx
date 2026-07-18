"use client";

import { materials, emissive } from "@/lib/materials";
import { Bx } from "./primitives";
import { SceneObject } from "@/lib/interactive/SceneObject";
import { DESK } from "./Desk";

export function Laptop() {
  const y = DESK.surfaceY;
  const open = -1.85; // lid angle (radians offset from flat)

  return (
    <SceneObject
      def={{ id: "laptop", name: "Laptop", cameraView: "desk" }}
      position={[-0.62, 0, -1.8]}
      rotation={[0, 0.3, 0]}
    >
      {/* Base */}
      <Bx position={[0, y + 0.01, 0]} scale={[0.32, 0.016, 0.22]} material={materials.deviceBody} />
      {/* Keyboard well */}
      <Bx position={[0, y + 0.019, 0.02]} scale={[0.28, 0.003, 0.12]} material={materials.keycap} castShadow={false} />
      {/* Lid + screen */}
      <group position={[0, y + 0.015, -0.108]} rotation={[open, 0, 0]}>
        <Bx position={[0, 0.105, 0]} scale={[0.32, 0.21, 0.012]} material={materials.deviceBody} />
        <mesh position={[0, 0.105, 0.008]}>
          <planeGeometry args={[0.29, 0.18]} />
          <meshStandardMaterial
            color="#0a0e16"
            emissive="#142438"
            emissiveIntensity={1.1}
            roughness={0.2}
            toneMapped={false}
          />
        </mesh>
      </group>
      {/* Sleep LED */}
      <Bx position={[0.14, y + 0.012, 0.1]} scale={[0.006, 0.004, 0.006]} material={emissive("#6ea8ff", 2)} castShadow={false} />
    </SceneObject>
  );
}
