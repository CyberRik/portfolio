"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import * as THREE from "three";
import { CAMERA_VIEWS, DEFAULT_VIEW } from "@/config/camera.config";
import { fog } from "@/config/theme";
import { Workspace } from "@/components/scene/Workspace";
import { PortalBeacons } from "@/components/scene/PortalBeacons";
import { PhysicsProvider } from "@/components/scene/PhysicsProvider";
import { Lighting } from "@/components/lighting/Lighting";
import { CameraRig } from "@/components/camera/CameraRig";
import { Effects } from "@/components/effects/Effects";
import { ReadyProbe } from "./ReadyProbe";
import { getQuality } from "@/lib/gpuTier";

/**
 * Canvas entry point. Everything inside is lazy: the page shell renders
 * instantly, the world streams in behind the loading screen.
 *
 * dpr capped at 1.75 + AdaptiveDpr keeps the post pipeline at 60fps
 * on mid-range GPUs; frameloop stays "always" because the room breathes.
 */
export function SceneCanvas() {
  const home = CAMERA_VIEWS[DEFAULT_VIEW];
  const q = getQuality();
  const dpr: [number, number] = q === "high" ? [1, 1.75] : q === "medium" ? [1, 1.25] : [0.75, 1];

  return (
    <Canvas
      shadows
      dpr={dpr}
      camera={{ position: home.position, fov: home.fov, near: 0.1, far: 60 }}
      gl={{
        antialias: q !== "low",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
        powerPreference: "high-performance",
      }}
      onCreated={({ scene }) => {
        scene.fog = new THREE.Fog(fog.color, fog.near, fog.far);
        scene.background = new THREE.Color(fog.color);
      }}
    >
      <Suspense fallback={null}>
        <PhysicsProvider>
          <Workspace />
        </PhysicsProvider>
        <PortalBeacons />
        <Lighting />
        <Effects />
        <CameraRig />
        <Preload all />
        <ReadyProbe />
      </Suspense>
      <AdaptiveDpr pixelated={false} />
    </Canvas>
  );
}
