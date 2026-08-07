"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { markSceneReady } from "@/lib/sceneReady";

/**
 * Frames to render after the shaders are ready, before releasing the
 * loading screen.
 *
 * Was 30, back when this number had to cover shader compilation as well
 * — every one of those frames was potentially compiling a program, so
 * the count was really a "give it a while" heuristic. Compilation is now
 * awaited explicitly below, so these frames only need to cover what is
 * left: the first shadow bake and the environment convolution. Eight is
 * comfortably past both, and each one costs ~16ms instead of ~165ms.
 */
const WARM_FRAMES = 8;

/**
 * Boot gate: compile everything, then render a few settled frames, then
 * release the loading screen.
 *
 * WHY THIS REPLACED `<Preload all />`
 *
 * Measured on a cold GPU shader cache, the wait between "every byte has
 * arrived" and "the room appears" was ~18 SECONDS, against 1.1s of
 * actual downloading. The scene resolves to 108 distinct shader
 * programs, and drei's `<Preload all />` compiles them through three's
 * synchronous `gl.compile()` — one program at a time, on the main
 * thread, at roughly 165ms each on a cold driver cache. 108 x 165ms is
 * almost exactly the 18s observed.
 *
 * `compileAsync` is the same work handed to the driver through
 * KHR_parallel_shader_compile, which lets it build programs across
 * cores instead of serially, and returns a promise rather than blocking.
 * The extension is widely supported (and present on this machine, 16
 * cores); where it is missing three falls back to the synchronous path,
 * so this is never worse than what it replaces.
 *
 * The two halves have to stay joined: compiling asynchronously while
 * ReadyProbe counted frames independently would just move the stall to
 * the first rendered frame, since a frame that needs an uncompiled
 * program compiles it there and then. Ready means compiled AND warm.
 */
export function ReadyProbe() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const [compiled, setCompiled] = useState(false);
  const frames = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const done = () => {
      if (!cancelled) setCompiled(true);
    };
    // Guarded: compileAsync landed in three r152, and a failure here must
    // degrade to "“compile lazily during the warm frames" rather than
    // leaving the loading screen up forever.
    try {
      const p = gl.compileAsync?.(scene, camera);
      if (p) p.then(done).catch(done);
      else done();
    } catch {
      done();
    }
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera]);

  useFrame(() => {
    if (!compiled) return;
    frames.current += 1;
    if (frames.current === WARM_FRAMES) markSceneReady();
  });

  return null;
}
