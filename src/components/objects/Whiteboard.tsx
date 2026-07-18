"use client";

import { materials } from "@/lib/materials";
import { Bx } from "./primitives";
import { SceneObject } from "@/lib/interactive/SceneObject";

/**
 * Wall-mounted whiteboard on the right wall, with faint marker strokes
 * (thin dark quads) and a marker tray.
 */
const strokes: Array<{ x: number; y: number; w: number; tilt: number; color: string }> = [
  { x: -0.5, y: 0.28, w: 0.5, tilt: 0.04, color: "#3d5a80" },
  { x: -0.42, y: 0.18, w: 0.34, tilt: -0.02, color: "#3d5a80" },
  { x: -0.48, y: 0.08, w: 0.42, tilt: 0.01, color: "#6b4c9a" },
  { x: 0.3, y: 0.22, w: 0.3, tilt: -0.03, color: "#b0563e" },
  { x: 0.34, y: 0.1, w: 0.38, tilt: 0.02, color: "#b0563e" },
  { x: 0.02, y: -0.12, w: 0.6, tilt: 0.0, color: "#3a3a3a" },
  { x: -0.2, y: -0.24, w: 0.3, tilt: -0.04, color: "#3a3a3a" },
];

export function Whiteboard() {
  return (
    <SceneObject
      def={{ id: "whiteboard", name: "Whiteboard", cameraView: "whiteboard" }}
      position={[3.9, 1.65, 0.5]}
      rotation={[0, -Math.PI / 2, 0]}
    >
      {/* Frame + surface */}
      <Bx position={[0, 0, -0.015]} scale={[1.9, 1.15, 0.03]} material={materials.metalMid} />
      <Bx position={[0, 0, 0.002]} scale={[1.8, 1.05, 0.008]} material={materials.whiteboard} castShadow={false} />

      {/* Marker strokes */}
      {strokes.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, 0.008]} rotation={[0, 0, s.tilt]}>
          <planeGeometry args={[s.w, 0.014]} />
          <meshBasicMaterial color={s.color} />
        </mesh>
      ))}

      {/* A rough "architecture diagram" box cluster */}
      {[
        [-0.45, 0.42],
        [0.05, 0.42],
        [0.5, 0.42],
      ].map(([x, y], i) => (
        <mesh key={`box-${i}`} position={[x, y, 0.008]}>
          <ringGeometry args={[0.05, 0.058, 4]} />
          <meshBasicMaterial color="#3a3a3a" />
        </mesh>
      ))}

      {/* Marker tray + markers */}
      <Bx position={[0, -0.62, 0.04]} scale={[0.6, 0.03, 0.08]} material={materials.metalMid} />
      <Bx position={[-0.1, -0.59, 0.04]} scale={[0.1, 0.018, 0.018]} material={materials.mug} />
      <Bx position={[0.08, -0.59, 0.04]} scale={[0.1, 0.018, 0.018]} material={materials.deviceBody} />
    </SceneObject>
  );
}
