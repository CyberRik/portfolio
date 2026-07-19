"use client";

import type { ReactNode } from "react";
import { CuboidCollider, Physics } from "@react-three/rapier";
import { ROOM } from "./Room";
import { useQuality } from "@/lib/gpuTier";

/**
 * Rapier world. Minimal for now: a fixed floor + walls so Phase 2 can
 * drop dynamic props (throwable objects, physical toys) with zero setup.
 * Sleeping world costs ~nothing per frame. Paused entirely on low-tier GPUs.
 */
export function PhysicsProvider({ children }: { children: ReactNode }) {
  const { width: W, height: H, depth: D } = ROOM;
  const paused = useQuality() === "low";
  return (
    <Physics gravity={[0, -9.81, 0]} timeStep="vary" colliders={false} paused={paused}>
      {/* Floor */}
      <CuboidCollider args={[W / 2, 0.1, D / 2]} position={[0, -0.1, 0]} />
      {/* Walls */}
      <CuboidCollider args={[W / 2, H / 2, 0.1]} position={[0, H / 2, -D / 2]} />
      <CuboidCollider args={[0.1, H / 2, D / 2]} position={[-W / 2, H / 2, 0]} />
      <CuboidCollider args={[0.1, H / 2, D / 2]} position={[W / 2, H / 2, 0]} />
      {children}
    </Physics>
  );
}
