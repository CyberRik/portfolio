"use client";

import { materials, emissive } from "@/lib/materials";
import { Cyl } from "./primitives";
import { SceneObject } from "@/lib/interactive/SceneObject";

/** Arc floor lamp in the front-left corner — the room's warm key accent. */
export function FloorLamp() {
  return (
    <SceneObject def={{ id: "floor-lamp", name: "Floor Lamp" }} position={[-3.1, 0, 1.6]}>
      {/* Base + pole */}
      <Cyl position={[0, 0.02, 0]} scale={[0.36, 0.04, 0.36]} material={materials.metalDark} />
      <Cyl position={[0, 0.9, 0]} scale={[0.035, 1.8, 0.035]} material={materials.metalDark} />
      {/* Angled arm */}
      <group position={[0, 1.78, 0]} rotation={[0, 0.6, -0.5]}>
        <Cyl position={[0, 0.3, 0]} scale={[0.03, 0.62, 0.03]} material={materials.metalDark} />
        {/* Shade */}
        <group position={[0, 0.62, 0]} rotation={[0, 0, 0.5]}>
          <mesh castShadow>
            <coneGeometry args={[0.19, 0.24, 24, 1, true]} />
            <primitive object={materials.metalDark} attach="material" />
          </mesh>
          {/* Bulb glow */}
          <mesh position={[0, -0.06, 0]}>
            <sphereGeometry args={[0.07, 12, 10]} />
            <primitive object={emissive("#ffcf9e", 1.7)} attach="material" />
          </mesh>
          <pointLight position={[0, -0.12, 0]} intensity={4.2} distance={4.2} decay={2} color="#ffc98f" castShadow shadow-mapSize={[512, 512]} />
        </group>
      </group>
    </SceneObject>
  );
}
