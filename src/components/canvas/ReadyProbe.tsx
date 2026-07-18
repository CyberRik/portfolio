"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { markSceneReady } from "@/lib/sceneReady";

const WARM_FRAMES = 30;

/**
 * Mounts inside the same Suspense boundary as the scene, so it only
 * starts counting once every GLTF/texture has resolved. After N
 * rendered frames (shader compile + shadow bake settled) it releases
 * the loading screen.
 */
export function ReadyProbe() {
  const frames = useRef(0);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === WARM_FRAMES) markSceneReady();
  });
  return null;
}
