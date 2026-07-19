"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents, PerformanceMonitor, Preload } from "@react-three/drei";
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
import { getQuality, QUALITY } from "@/lib/gpuTier";

/**
 * Canvas entry point. Everything inside is lazy: the page shell renders
 * instantly, the world streams in behind the loading screen.
 *
 * Resolution is governed in three layers, cheapest first:
 *   - the tier's static dpr ceiling (GPU class)
 *   - PerformanceMonitor, which walks that ceiling down when the real
 *     frame budget says the tier guessed too high (and back up when it
 *     recovers) — the detection heuristics can't know about a laptop on
 *     battery, a 4K panel, or a busy machine
 *   - AdaptiveDpr, which drops resolution during camera flights only
 *
 * MSAA is off deliberately: EffectComposer renders the scene into its own
 * non-multisampled target, so a multisampled default framebuffer would be
 * allocated and then never used for anything but the final blit. SMAA in
 * the post chain does the antialiasing instead, for less bandwidth.
 */
export function SceneCanvas() {
  const home = CAMERA_VIEWS[DEFAULT_VIEW];
  const q = getQuality();
  const [ceiling, floor] = [QUALITY[q].dpr[1], QUALITY[q].dpr[0]];
  const [dpr, setDpr] = useState(ceiling);

  return (
    <Canvas
      shadows
      dpr={dpr}
      camera={{ position: home.position, fov: home.fov, near: 0.1, far: 60 }}
      gl={{
        antialias: false,
        stencil: false,
        depth: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
        powerPreference: "high-performance",
      }}
      onCreated={({ scene }) => {
        scene.fog = new THREE.Fog(fog.color, fog.near, fog.far);
        scene.background = new THREE.Color(fog.color);
      }}
    >
      <PerformanceMonitor
        onIncline={() => setDpr(ceiling)}
        onDecline={() => setDpr(floor)}
        flipflops={3}
        // after three oscillations, stop second-guessing and stay low
        onFallback={() => setDpr(floor)}
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
      </PerformanceMonitor>
      <AdaptiveDpr pixelated={false} />
      {/* raycasting is throttled while the camera is moving — the room has
          ~45 meshes and pointer-move hit-testing is pure CPU */}
      <AdaptiveEvents />
    </Canvas>
  );
}
