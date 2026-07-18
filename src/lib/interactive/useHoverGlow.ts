"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { subscribeHover } from "@/lib/interaction";

/**
 * Damped 0→1 hover intensity for an object id. Objects read
 * `glow.current` inside their own useFrame to modulate lights and
 * emissives — light responds, nothing scales or bounces.
 */
export function useHoverGlow(id: string, lambda = 7): RefObject<number> {
  const glow = useRef(0);
  const target = useRef(0);

  useEffect(
    () =>
      subscribeHover((info) => {
        target.current = info?.id === id ? 1 : 0;
      }),
    [id],
  );

  useFrame((_, delta) => {
    glow.current = THREE.MathUtils.damp(glow.current, target.current, lambda, delta);
  });

  return glow;
}
