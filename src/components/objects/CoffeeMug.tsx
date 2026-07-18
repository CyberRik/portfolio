"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { materials } from "@/lib/materials";
import { SceneObject } from "@/lib/interactive/SceneObject";
import { DESK } from "./Desk";

const STEAM_COUNT = 24;

/** Rising, wavering steam rendered as soft additive points. */
function Steam() {
  const ref = useRef<THREE.Points>(null);
  const seeds = useMemo(
    () =>
      Array.from({ length: STEAM_COUNT }, () => ({
        offset: Math.random(),
        radius: 0.004 + Math.random() * 0.012,
        phase: Math.random() * Math.PI * 2,
      })),
    [],
  );
  const positions = useMemo(() => new Float32Array(STEAM_COUNT * 3), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < STEAM_COUNT; i++) {
      const s = seeds[i];
      const life = (t * 0.12 + s.offset) % 1;
      positions[i * 3] = Math.sin(t * 0.8 + s.phase) * s.radius * (1 + life * 3);
      positions[i * 3 + 1] = life * 0.22;
      positions[i * 3 + 2] = Math.cos(t * 0.7 + s.phase) * s.radius * (1 + life * 3);
    }
    if (ref.current) {
      ref.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={ref} position={[0, 0.1, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.022}
        color="#d8d4cc"
        transparent
        opacity={0.1}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

export function CoffeeMug() {
  const y = DESK.surfaceY;

  return (
    <SceneObject
      def={{ id: "coffee-mug", name: "Coffee", cameraView: "desk" }}
      position={[0.75, y, -1.95]}
    >
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.042, 0.036, 0.1, 20]} />
        <meshStandardMaterial color="#c9553d" roughness={0.3} />
      </mesh>
      {/* Coffee surface */}
      <mesh position={[0, 0.096, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.036, 20]} />
        <meshStandardMaterial color="#2b1a10" roughness={0.15} />
      </mesh>
      {/* Handle */}
      <mesh position={[0.05, 0.05, 0]} rotation={[0, 0, 0]} castShadow>
        <torusGeometry args={[0.024, 0.007, 10, 18]} />
        <primitive object={materials.mug} attach="material" />
      </mesh>
      <Steam />
    </SceneObject>
  );
}
