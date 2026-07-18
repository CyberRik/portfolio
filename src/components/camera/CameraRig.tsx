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
import { registerFlyTo, registerFlyToPose } from "./cameraBus";

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
    const tweenTo = (
      position: readonly [number, number, number],
      target: readonly [number, number, number],
      duration: number,
      fov?: number,
    ) => {
      const controls = controlsRef.current;
      if (!controls) return;
      flying.current = true;
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(controls.target);
      gsap.to(camera.position, {
        x: position[0],
        y: position[1],
        z: position[2],
        duration,
        ease: "power3.inOut",
      });
      if (fov) {
        gsap.to(baseFov, { current: fov, duration, ease: "power3.inOut" });
      }
      gsap.to(controls.target, {
        x: target[0],
        y: target[1],
        z: target[2],
        duration,
        ease: "power3.inOut",
        onUpdate: () => controls.update(),
        onComplete: () => {
          flying.current = false;
        },
      });
    };

    registerFlyTo((view: CameraViewId, duration = 1.8) => {
      const v = CAMERA_VIEWS[view];
      tweenTo(v.position, v.target, duration, v.fov);
    });
    registerFlyToPose((position, target, duration = 1.5) => {
      tweenTo(position, target, duration);
    });
    return () => {
      registerFlyTo(null);
      registerFlyToPose(null);
    };
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

    // Diorama-safe orbit envelope. A box with one open face means some
    // orbit poses stare at the roof or the outer wall skins. OrbitControls
    // can't couple angles to distance, so each frame we clamp:
    //   - height ceiling: camera never rises above the roofline
    //   - side planes: camera never crosses the side-wall planes
    // The camera glides along these invisible planes instead of
    // clipping behind them; up close the clamps disengage naturally.
    if (!flying.current) {
      const dist = camera.position.distanceTo(controls.target);

      const MAX_CAM_Y = 3.0;
      if (camera.position.y > MAX_CAM_Y) {
        const cosP = THREE.MathUtils.clamp((MAX_CAM_Y - controls.target.y) / dist, -1, 1);
        controls.setPolarAngle(Math.acos(cosP));
      }

      const MAX_CAM_X = 3.85;
      const horiz = dist * Math.sin(controls.getPolarAngle());
      if (horiz > 1e-4) {
        const az = controls.getAzimuthalAngle();
        const sinAzMax = (MAX_CAM_X - controls.target.x) / horiz;
        if (sinAzMax < 1 && az > Math.asin(Math.max(sinAzMax, -1))) {
          controls.setAzimuthalAngle(Math.asin(Math.max(sinAzMax, -1)));
        }
        const sinAzMin = (-MAX_CAM_X - controls.target.x) / horiz;
        if (sinAzMin > -1 && az < Math.asin(Math.min(sinAzMin, 1))) {
          controls.setAzimuthalAngle(Math.asin(Math.min(sinAzMin, 1)));
        }
      }
    }

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
