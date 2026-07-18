"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const COUNT = 140;

/**
 * Slow-drifting dust motes, densest in the sun shaft near the window.
 * One Points draw call; positions advected on the CPU (140 particles ≈ free).
 */
export function DustParticles() {
  const ref = useRef<THREE.Points>(null);

  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT; i++) {
      // two populations: 60% inside the sun shaft (catching light),
      // 40% scattered through the room (depth)
      const inShaft = i < COUNT * 0.7;
      positions[i * 3] = inShaft ? (Math.random() - 0.5) * 2.4 : (Math.random() - 0.5) * 4.2;
      positions[i * 3 + 1] = 0.3 + Math.random() * 1.8;
      positions[i * 3 + 2] = inShaft ? -3 + Math.random() * 2.2 : -2.5 + Math.random() * 3.2;
      seeds[i * 4] = Math.random() * Math.PI * 2;
      seeds[i * 4 + 1] = 0.02 + Math.random() * 0.05; // rise speed
      seeds[i * 4 + 2] = 0.1 + Math.random() * 0.4; // sway radius
      seeds[i * 4 + 3] = 0.1 + Math.random() * 0.3; // sway speed
    }
    return { positions, seeds };
  }, []);

  useFrame((state, delta) => {
    const pts = ref.current;
    if (!pts) return;
    const arr = pts.geometry.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      const p = seeds[i * 4];
      arr[i * 3] += Math.sin(t * seeds[i * 4 + 3] + p) * 0.0004;
      arr[i * 3 + 1] += seeds[i * 4 + 1] * delta;
      arr[i * 3 + 2] += Math.cos(t * seeds[i * 4 + 3] + p) * 0.0003;
      if (arr[i * 3 + 1] > 2.2) arr[i * 3 + 1] = 0.2;
    }
    pts.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      {/* Normal blending: additive dust in front of the bright window
          clips to white and blooms into fake "stars" */}
      <pointsMaterial
        size={0.008}
        color="#cfc2ae"
        transparent
        opacity={0.12}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
