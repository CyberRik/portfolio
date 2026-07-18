"use client";

import { SceneObject } from "@/lib/interactive/SceneObject";
import { DESK } from "./Desk";

export function Mouse() {
  const y = DESK.surfaceY;

  return (
    <SceneObject
      def={{ id: "mouse", name: "Mouse", cameraView: "desk" }}
      position={[0.42, y, -1.7]}
      rotation={[0, -0.3, 0]}
    >
      <mesh position={[0, 0.02, 0]} scale={[0.06, 0.036, 0.1]} castShadow>
        <sphereGeometry args={[0.5, 20, 14]} />
        <meshStandardMaterial color="#22222a" roughness={0.55} metalness={0.3} />
      </mesh>
      {/* Scroll wheel groove */}
      <mesh position={[0, 0.037, -0.022]} scale={[0.006, 0.006, 0.014]}>
        <boxGeometry />
        <meshStandardMaterial color="#111114" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[0.24, 0.2]} />
        <meshStandardMaterial color="#1c1a18" roughness={1} />
      </mesh>
    </SceneObject>
  );
}
