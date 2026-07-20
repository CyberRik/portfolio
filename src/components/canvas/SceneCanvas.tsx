"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor, Preload } from "@react-three/drei";
import { useSceneReady } from "@/lib/sceneReady";
import * as THREE from "three";
import { CAMERA_VIEWS, DEFAULT_VIEW, resolveView } from "@/config/camera.config";
import { fog } from "@/config/theme";
import { Workspace } from "@/components/scene/Workspace";
import { PortalBeacons } from "@/components/scene/PortalBeacons";
import { PhysicsProvider } from "@/components/scene/PhysicsProvider";
import { Lighting } from "@/components/lighting/Lighting";
import { CameraRig } from "@/components/camera/CameraRig";
import { Effects } from "@/components/effects/Effects";
import { ReadyProbe } from "./ReadyProbe";
import { getQuality, QUALITY } from "@/lib/gpuTier";

/** Granularity of the resolution ladder between a tier's floor and ceiling. */
const DPR_STEP = 0.25;

/**
 * Grace period after the scene reports ready before frame times are
 * allowed to move the resolution. Covers the tail of first-frame work
 * that ReadyProbe's warm-frame count doesn't: the last shader variants
 * compiling, the initial shadow bake, and the loading screen's own fade.
 */
const ARM_DELAY_MS = 2500;

/** Ascending list of allowed pixel ratios for a tier, floor → ceiling. */
function dprLadder(floor: number, ceiling: number): number[] {
  const rungs: number[] = [];
  for (let v = floor; v < ceiling - 1e-6; v += DPR_STEP) rungs.push(+v.toFixed(3));
  rungs.push(ceiling);
  return rungs;
}

/**
 * Canvas entry point. Everything inside is lazy: the page shell renders
 * instantly, the world streams in behind the loading screen.
 *
 * Resolution is governed in three layers, cheapest first:
 *   - the tier's static dpr ceiling (GPU class)
 *   - PerformanceMonitor, which walks that ceiling up and down a rung at
 *     a time once the scene has settled — the detection heuristics can't
 *     know about a laptop on battery, a 4K panel, or a busy machine
 *   - AdaptiveDpr, which drops resolution during camera flights only
 *
 * MSAA is off deliberately: EffectComposer renders the scene into its own
 * non-multisampled target, so a multisampled default framebuffer would be
 * allocated and then never used for anything but the final blit. SMAA in
 * the post chain does the antialiasing instead, for less bandwidth.
 */
export function SceneCanvas() {
  // Resolved against the real viewport rather than taken raw: the Canvas
  // renders its first frames from these numbers, before CameraRig has
  // mounted, so on a phone the raw landscape pose would be visible as a
  // brief wrong-framing flash behind the loading screen's fade.
  const home = useMemo(() => {
    const aspect =
      typeof window === "undefined" ? 16 / 9 : window.innerWidth / window.innerHeight;
    return resolveView(CAMERA_VIEWS[DEFAULT_VIEW], aspect);
  }, []);
  const q = getQuality();
  const [ceiling, floor] = [QUALITY[q].dpr[1], QUALITY[q].dpr[0]];

  const ladder = useMemo(() => dprLadder(floor, ceiling), [floor, ceiling]);
  const top = ladder.length - 1;
  const [rung, setRung] = useState(top);
  const dpr = ladder[rung];

  /**
   * PerformanceMonitor starts averaging frame times the moment it mounts,
   * which on a cold load is the *worst* window there is — assets still
   * streaming in over the network, shaders compiling, shadows baking.
   * Those samples describe the load, not the machine, so the callbacks
   * stay disarmed until the scene has been ready and settled.
   *
   * This is the localhost/production divergence: served from disk the
   * load window is short enough that the monitor never trips, so dev
   * always ran at the tier ceiling. Over a real network the same build
   * tripped it during startup and pinned the session low.
   */
  const ready = useSceneReady();
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setArmed(true), ARM_DELAY_MS);
    return () => clearTimeout(t);
  }, [ready]);

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

      {/* Mounted as a childless leaf, and only once armed. Gating the
          callbacks alone would not be enough: the monitor samples from
          the frame it mounts, and `flipped` counts every adjustment in
          either direction — so a cold load burns through `flipflops` and
          latches `api.fallback`, after which it returns early forever and
          never samples again. Mounting late is what guarantees the very
          first samples describe the settled scene. Nothing reads its
          context (no `usePerformanceMonitor` anywhere), so it does not
          need to wrap the scene. */}
      {armed && (
        <PerformanceMonitor
          // One rung at a time, in both directions. The old code slammed
          // straight from ceiling to floor on a single decline, so one
          // stutter cost the whole session its resolution — a jump that
          // is both very visible and far more than recovering needs.
          onIncline={() => setRung((r) => Math.min(top, r + 1))}
          onDecline={() => setRung((r) => Math.max(0, r - 1))}
          flipflops={3}
          // Once it gives up, settle one rung below the top rather than
          // on the floor: oscillating means the machine is near a
          // boundary, not that it is slow.
          onFallback={() => setRung(Math.max(0, top - 1))}
        />
      )}
      <AdaptiveDpr pixelated={false} />
      {/* NO <AdaptiveEvents/> here, deliberately. It is implemented as
          `setEvents({ enabled: performance.current === 1 })`, i.e. it
          disables ALL raycasting whenever performance is regressed — so
          hovering an object stops highlighting it, the pointer cursor
          never appears, and clicking it does nothing. On a machine that
          sits below the threshold that state is permanent. Saving a few
          raycasts is not worth silently killing every interaction in the
          room. */}
    </Canvas>
  );
}
