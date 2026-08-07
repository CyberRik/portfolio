"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { useSceneReady } from "@/lib/sceneReady";
import * as THREE from "three";
import { CAMERA_VIEWS, DEFAULT_VIEW, resolveView } from "@/config/camera.config";
import { fog } from "@/config/theme";
import { Workspace } from "@/components/scene/Workspace";
import { PortalBeacons } from "@/components/scene/PortalBeacons";
import { Lighting } from "@/components/lighting/Lighting";
import { CameraRig } from "@/components/camera/CameraRig";
import { Effects } from "@/components/effects/Effects";
import { ReadyProbe } from "./ReadyProbe";
import { PortalSuspend } from "./PortalSuspend";
import { dprRange, getQuality } from "@/lib/gpuTier";

/**
 * Minimum ratio between adjacent rungs of the resolution ladder.
 *
 * Changing `dpr` is not a cheap dial — it resizes every render target in
 * the post chain (the multisampled scene target, N8AO's buffers, Bloom's
 * mip chain, SMAA's edge and weight textures), and that reallocation
 * costs a visible frame hitch, measured at 100-230ms. So a rung is only
 * worth having if the resolution it saves outweighs one stall.
 *
 * The old fixed 0.25 step produced rungs like 1.25 and 1.3 — a 4%
 * resolution change bought with a 200ms stall, and worse, close rungs let
 * PerformanceMonitor oscillate between two nearly identical states,
 * hitching every time. Requiring a real gap means the ladder is usually
 * just [floor, ceiling]: one meaningful step, taken rarely.
 */
const MIN_RUNG_RATIO = 1.2;

/**
 * Grace period after the scene reports ready before frame times are
 * allowed to move the resolution. Covers the tail of first-frame work
 * that ReadyProbe's warm-frame count doesn't: the last shader variants
 * compiling, the initial shadow bake, and the loading screen's own fade.
 */
const ARM_DELAY_MS = 2500;

/** Ascending list of allowed pixel ratios for a tier, floor → ceiling. */
function dprLadder(floor: number, ceiling: number): number[] {
  const rungs = [ceiling];
  for (let v = ceiling / MIN_RUNG_RATIO; v >= floor * MIN_RUNG_RATIO; v /= MIN_RUNG_RATIO) {
    rungs.push(+v.toFixed(3));
  }
  if (ceiling / floor >= MIN_RUNG_RATIO) rungs.push(floor);
  return rungs.sort((a, b) => a - b);
}

/**
 * Canvas entry point. Everything inside is lazy: the page shell renders
 * instantly, the world streams in behind the loading screen.
 *
 * Resolution is governed in three layers, cheapest first:
 *   - the tier's supersample target, resolved against THIS display's
 *     devicePixelRatio and capped by a pixel budget (see dprRange)
 *   - PerformanceMonitor, which walks that ceiling up and down a rung at
 *     a time once the scene has settled — the detection heuristics can't
 *     know about a laptop on battery, a 4K panel, or a busy machine
 *   - and nothing else: AdaptiveDpr was removed, see below
 *
 * The CANVAS `antialias` flag stays off: EffectComposer renders into its
 * own target, so a multisampled default framebuffer would be allocated and
 * never used for anything but the final blit. That is not the same thing
 * as "no MSAA" — the composer's own target IS multisampled (see Effects),
 * which is what actually resolves geometric edges here.
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

  /**
   * Resolved once, against the real display and viewport.
   *
   * Lazy useState rather than a bare call on purpose: `dprRange` reads
   * `window.devicePixelRatio`, which does not exist during prerender, and
   * the range must keep a stable identity for the life of the session —
   * recomputing it on a later render would rebuild the ladder and reset
   * whatever rung PerformanceMonitor had settled on.
   */
  const [[floor, ceiling]] = useState<[number, number]>(() =>
    typeof window === "undefined"
      ? [1, 1]
      : dprRange(q, window.innerWidth, window.innerHeight),
  );

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
        {/* NO physics world here. There was a <Physics paused> wrapper
            with a floor and four wall colliders, kept as scaffolding for
            dynamic props. It cost nothing per frame — it was paused, and
            with no dynamic bodies a step could only reproduce its own
            input — but it was never free: @react-three/rapier ships its
            wasm inlined as base64, which is a 2.2MB chunk pulled during
            scene load, inside this Suspense boundary and therefore on the
            path to first render. That is a large fraction of the startup
            budget spent on a placeholder. Reinstate it (git history has
            PhysicsProvider.tsx intact) when the first dynamic body
            actually lands, not before. */}
        <Workspace />
        <PortalBeacons />
        <Lighting />
        <Effects />
        <CameraRig />
        {/* NO <Preload all /> — ReadyProbe owns warmup now, and does it
            through gl.compileAsync so the scene's 108 shader programs
            build in parallel rather than serially on the main thread.
            Measured cold, the synchronous drei version cost ~18s between
            the last byte landing and the room appearing, against 1.1s of
            actual downloading. See ReadyProbe. */}
        <ReadyProbe />
        <PortalSuspend />
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
          // Sample slowly and decide late: ~6s of sustained evidence
          // before touching the resolution.
          //
          // At the stock 250ms x 6 the monitor reacted to a single orbit
          // drag — dragging dips the frame rate a little, the monitor read
          // that as a slow machine, and the resulting rung change cost a
          // ~110ms reallocation of the entire post chain. So the act of
          // moving the camera caused the stutter you'd only notice while
          // moving the camera. It has to be slower than the interactions
          // it is meant to be measuring around.
          ms={600}
          iterations={10}
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
      {/* NO <AdaptiveDpr/> here, and this is the one that mattered for
          smoothness. It lowers dpr whenever the render loop "regresses",
          and OrbitControls regresses on every change — so it fired at the
          start of every drag and again when the drag stopped. Each of
          those is a full resize of the post chain, i.e. exactly the
          100-230ms hitch that made orbiting feel laggy. It was paying a
          stall to save resolution during the moment the user is most
          likely to notice a stall. With the pixel budget now keeping the
          frame well inside 60fps on its own, there is nothing left for it
          to rescue.

          NO <AdaptiveEvents/> either, for a separate reason. It is
          implemented as
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
