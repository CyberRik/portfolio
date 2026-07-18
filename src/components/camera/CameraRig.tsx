"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import gsap from "gsap";
import {
  CAMERA_FEEL,
  CAMERA_VIEWS,
  DEFAULT_VIEW,
  IDLE_DRIFT,
  ORBIT_LIMITS,
  type CameraViewId,
} from "@/config/camera.config";
import { registerFlyTo } from "./cameraBus";

/**
 * The camera never feels locked:
 *  - constrained, damped OrbitControls (orbit / zoom / slight pan)
 *  - idle drift: two incommensurate sine frequencies on azimuth +
 *    target bob, eased in/out — organic, never metronomic
 *  - permanent micro-motion: fov "breathing" and pointer parallax
 *    applied AFTER controls.update() each frame (controls re-derive
 *    orientation every frame, so the offsets never accumulate)
 *  - gsap flyTo(view) with power3 easing between named views
 */
export function CameraRig() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const lastInteraction = useRef(-Infinity);
  const flying = useRef(false);
  const driftPhase = useRef(0);
  const baseFov = useRef(CAMERA_VIEWS[DEFAULT_VIEW].fov ?? 45);
  const parallax = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const flyTo = (view: CameraViewId, duration = 1.8) => {
      const controls = controlsRef.current;
      if (!controls) return;
      const v = CAMERA_VIEWS[view];
      flying.current = true;
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(controls.target);
      gsap.to(camera.position, {
        x: v.position[0],
        y: v.position[1],
        z: v.position[2],
        duration,
        ease: "power3.inOut",
      });
      if (v.fov) {
        gsap.to(baseFov, {
          current: v.fov,
          duration,
          ease: "power3.inOut",
        });
      }
      gsap.to(controls.target, {
        x: v.target[0],
        y: v.target[1],
        z: v.target[2],
        duration,
        ease: "power3.inOut",
        onUpdate: () => controls.update(),
        onComplete: () => {
          flying.current = false;
        },
      });
    };
    registerFlyTo(flyTo);
    return () => registerFlyTo(null);
  }, [camera]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const onStart = () => {
      lastInteraction.current = performance.now() / 1000;
    };
    // 'start' only — the drift itself fires 'change', which would
    // otherwise reset the idle timer every frame
    controls.addEventListener("start", onStart);
    return () => {
      controls.removeEventListener("start", onStart);
    };
  }, []);

  useFrame((state, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const t = state.clock.elapsedTime;

    if (!flying.current) {
      const idleFor = performance.now() / 1000 - lastInteraction.current;
      const active = idleFor > IDLE_DRIFT.resumeDelay ? 1 : 0;
      driftPhase.current = THREE.MathUtils.damp(driftPhase.current, active, 1.2, delta);

      if (driftPhase.current > 0.001) {
        const d = driftPhase.current;
        const s = IDLE_DRIFT.speed;
        // two incommensurate frequencies — never reads as a loop
        const sway = Math.sin(t * s) * 0.7 + Math.sin(t * s * 0.53 + 1.7) * 0.4;
        controls.setAzimuthalAngle(controls.getAzimuthalAngle() + sway * 0.00035 * d);
        controls.target.y +=
          (Math.sin(t * s * 1.7) * 0.6 + Math.sin(t * s * 0.91 + 0.8) * 0.4) *
          IDLE_DRIFT.amplitude *
          0.0009 *
          d;
      }
    }

    controls.update();

    // ---- micro-motion, applied after controls resolve orientation ----

    // Pointer parallax: the world leans a hair's width toward the cursor
    const p = parallax.current;
    p.x = THREE.MathUtils.damp(p.x, state.pointer.x, CAMERA_FEEL.parallaxDamping, delta);
    p.y = THREE.MathUtils.damp(p.y, state.pointer.y, CAMERA_FEEL.parallaxDamping, delta);
    camera.rotateY(-p.x * CAMERA_FEEL.parallaxYaw);
    camera.rotateX(p.y * CAMERA_FEEL.parallaxPitch);

    // Breathing: sub-quarter-degree fov oscillation
    camera.fov =
      baseFov.current +
      Math.sin(t * CAMERA_FEEL.breatheSpeed * Math.PI * 2) * CAMERA_FEEL.breatheAmplitude;
    camera.updateProjectionMatrix();
  });

  const home = CAMERA_VIEWS[DEFAULT_VIEW];

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      target={home.target}
      enableDamping
      dampingFactor={0.055}
      enablePan
      panSpeed={0.35}
      screenSpacePanning
      rotateSpeed={0.5}
      zoomSpeed={0.65}
      minDistance={ORBIT_LIMITS.minDistance}
      maxDistance={ORBIT_LIMITS.maxDistance}
      minPolarAngle={ORBIT_LIMITS.minPolarAngle}
      maxPolarAngle={ORBIT_LIMITS.maxPolarAngle}
      minAzimuthAngle={ORBIT_LIMITS.minAzimuthAngle}
      maxAzimuthAngle={ORBIT_LIMITS.maxAzimuthAngle}
    />
  );
}
