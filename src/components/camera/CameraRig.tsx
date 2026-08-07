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
  COMFORT_WEDGE,
  DEFAULT_VIEW,
  IDLE_DRIFT,
  ORBIT_LIMITS,
  resolveView,
  type CameraViewId,
} from "@/config/camera.config";
import {
  registerFlyTo,
  registerFlyToPose,
  registerPortalDepth,
  type FlightMeta,
} from "./cameraBus";
import { focusStore } from "@/lib/focus";
import { framedFov } from "@/lib/framing";
import { useCoarsePointer } from "@/lib/interaction";

/**
 * Directed camera. Every flight is staged like a dolly move:
 *
 *   anticipation — a small breath backward before departure
 *   glide        — a curved path (quadratic bezier, lifted + bowed
 *                  sideways) so the camera arcs through the room
 *                  instead of tracking a straight rail
 *   focus pull   — fov eases slightly tight mid-flight and relaxes
 *                  on arrival
 *   settle       — the look-target lands with a whisper of overshoot
 *
 * Free orbit stays available but weighted: heavy damping, slow rates,
 * and the diorama-safe envelope (roof ceiling + side-wall planes).
 */
export function CameraRig() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  /**
   * Touch-primary devices get a pure turntable: rotation only, orbiting
   * the room's centre anchor, with no dolly and no parallax. See the
   * OrbitControls props and the parallax block for why each half of that
   * is a separate decision.
   */
  const coarse = useCoarsePointer();
  const lastInteraction = useRef(-Infinity);
  const flying = useRef(false);
  /** true once the user has orbited manually since the last flight —
   *  only then may the self-recovery re-frame a parked pose */
  const manualTaken = useRef(false);
  const driftPhase = useRef(0);
  const baseFov = useRef(CAMERA_VIEWS[DEFAULT_VIEW].fov ?? 45);
  const parallax = useRef({ x: 0, y: 0 });
  const timeline = useRef<gsap.core.Timeline | null>(null);
  /** portal experiences dolly inside the normal orbit floor */
  const portalActive = useRef(false);
  /** is the pose we are sitting on composed for this viewport's shape? */
  const authoredPose = useRef(false);

  useEffect(() => {
    const flyTo = (
      position: readonly [number, number, number],
      target: readonly [number, number, number],
      duration: number,
      fov: number | undefined,
      meta: FlightMeta | undefined,
      isHome: boolean,
    ) => {
      const controls = controlsRef.current;
      if (!controls) return;

      if (timeline.current) {
        timeline.current.kill();
        flying.current = false; // kill() doesn't fire onComplete, so reset manually
      }
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(controls.target);
      gsap.killTweensOf(baseFov);
      flying.current = true;
      manualTaken.current = false; // a flight re-establishes an authored pose

      if (meta) focusStore.flying(meta.id, meta.name);
      else if (isHome) focusStore.clear();
      else focusStore.flying();

      const p1 = new THREE.Vector3(...position);
      const t1 = new THREE.Vector3(...target);
      const travel = camera.position.distanceTo(p1);

      // Short hops skip the ceremony — no anticipation on tiny moves
      const anticipation = travel > 1.6 ? 0.26 : 0;

      const tl = gsap.timeline({
        defaults: { overwrite: "auto" },
        onComplete: () => {
          flying.current = false;
          if (meta) focusStore.arrived();
          else if (!isHome) focusStore.clear();
          // restore the orbit floor only once the exit flight has
          // landed — doing it while still deep would snap the radius
          const c = controlsRef.current;
          if (c && !portalActive.current) c.minDistance = ORBIT_LIMITS.minDistance;
        },
      });
      timeline.current = tl;

      // --- anticipation: breathe back along the current view axis ---
      if (anticipation > 0) {
        const back = camera.position.clone().sub(controls.target).normalize().multiplyScalar(0.1);
        tl.to(camera.position, {
          x: camera.position.x + back.x,
          y: camera.position.y + back.y * 0.4,
          z: camera.position.z + back.z,
          duration: anticipation,
          ease: "power2.out",
        });
      }

      // --- glide along a curved dolly path ---
      const progress = { t: 0 };
      const p0 = new THREE.Vector3();
      const mid = new THREE.Vector3();
      tl.add(() => {
        // snapshot departure AFTER the anticipation beat
        p0.copy(camera.position);
        mid.copy(p0).lerp(p1, 0.5);
        mid.y += Math.min(0.45, travel * 0.1);
        const dx = p1.x - p0.x;
        const dz = p1.z - p0.z;
        const h = Math.hypot(dx, dz);
        if (h > 0.4) {
          // bow the path sideways, outward from the room's center line
          let px = -dz / h;
          let pz = dx / h;
          if (px * mid.x + pz * mid.z < 0) {
            px = -px;
            pz = -pz;
          }
          const bow = Math.min(0.5, travel * 0.08);
          mid.x += px * bow;
          mid.z += pz * bow;
        }
      });
      tl.to(progress, {
        t: 1,
        duration,
        ease: "power3.inOut",
        onUpdate: () => {
          const t = progress.t;
          const s = 1 - t;
          camera.position.set(
            s * s * p0.x + 2 * s * t * mid.x + t * t * p1.x,
            s * s * p0.y + 2 * s * t * mid.y + t * t * p1.y,
            s * s * p0.z + 2 * s * t * mid.z + t * t * p1.z,
          );
        },
      });

      // --- look target: eases with a whisper of overshoot-settle ---
      tl.to(
        controls.target,
        {
          x: t1.x,
          y: t1.y,
          z: t1.z,
          duration: duration * 1.02,
          ease: "back.out(0.55)",
          onUpdate: () => controls.update(),
        },
        anticipation > 0 ? anticipation * 0.5 : 0,
      );

      // --- focus pull: tighten slightly mid-flight, relax on arrival ---
      const targetFov = fov ?? baseFov.current;
      tl.to(
        baseFov,
        { current: targetFov * 0.965, duration: duration * 0.6, ease: "power2.in" },
        anticipation,
      );
      tl.to(baseFov, { current: targetFov, duration: duration * 0.5, ease: "sine.out" }, ">");
    };

    registerFlyTo((view: CameraViewId, duration = 2.2, meta?: FlightMeta) => {
      // Resolved at departure, not at module load: the viewport shape can
      // change between flights (orientation, window drag), and the pose
      // that is right for the shape we are flying INTO is the one to use.
      const v = resolveView(CAMERA_VIEWS[view], camera.aspect);
      authoredPose.current = v.authored;
      flyTo(v.position, v.target, duration, v.fov, meta, view === DEFAULT_VIEW);
    });
    registerFlyToPose((position, target, duration = 2.0, meta) => {
      // Poses computed from an object's bounding sphere are shape-agnostic,
      // so they still want the fov correction.
      authoredPose.current = false;
      flyTo(position, target, duration, undefined, meta, false);
    });
    registerPortalDepth((active) => {
      portalActive.current = active;
      const c = controlsRef.current;
      if (!c) return;
      // while a world is open the camera is authored, not navigated —
      // in-scene worlds (monitor desktop) don't block the canvas, so
      // orbiting must be off or a drag would tear the camera off the pose
      c.enabled = !active;
      // relax immediately on open; restoration waits for flight landing
      if (active) c.minDistance = 0.45;
    });
    return () => {
      registerFlyTo(null);
      registerFlyToPose(null);
      registerPortalDepth(null);
      timeline.current?.kill();
    };
  }, [camera]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const onStart = () => {
      lastInteraction.current = performance.now() / 1000;
      if (!flying.current) {
        manualTaken.current = true;
        // manual input dissolves the staged focus back to exploration
        if (focusStore.get().phase === "arrived") focusStore.clear();
      }
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
      const idleFor = performance.now() / 1000 - lastInteraction.current;

      const MAX_CAM_Y = 3.0;
      if (camera.position.y > MAX_CAM_Y) {
        const cosP = THREE.MathUtils.clamp((MAX_CAM_Y - controls.target.y) / dist, -1, 1);
        controls.setPolarAngle(Math.acos(cosP));
      }

      const MAX_CAM_X = 3.4;
      const MIN_CAM_Z = -2.5;
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
        // back plane: camera.z = target.z + horiz·cos(az) must stay in
        // front of the rear wall (valid while |az| < π/2, which the
        // static azimuth limits guarantee)
        const cosAzMin = THREE.MathUtils.clamp(
          (MIN_CAM_Z - controls.target.z) / horiz,
          -1,
          1,
        );
        const azLim = Math.acos(cosAzMin);
        const azNow = controls.getAzimuthalAngle();
        if (Math.abs(azNow) > azLim) {
          controls.setAzimuthalAngle(Math.sign(azNow) * azLim);
        }
      }

      // --- centre pivot + self-recovery: never irreversibly stuck ---
      // Flights orbit their authored subject and hold. But manual
      // control means "look around the room": the moment the user
      // grabs or scrolls, the look-target glides home to the central
      // anchor, so all free orbiting pivots around the room itself —
      // the whole diorama stays in view, turntable-style. Once input
      // goes quiet, azimuth parked outside the comfort band eases
      // back inside too — the shot quietly re-frames itself.
      if (manualTaken.current) {
        const [ax, ay, az0] = COMFORT_WEDGE.anchor;
        const aLam = COMFORT_WEDGE.anchorLambda;
        const tgt = controls.target;
        tgt.x = THREE.MathUtils.damp(tgt.x, ax, aLam, delta);
        tgt.y = THREE.MathUtils.damp(tgt.y, ay, aLam, delta);
        tgt.z = THREE.MathUtils.damp(tgt.z, az0, aLam, delta);

        if (idleFor > COMFORT_WEDGE.settleDelay) {
          const az = controls.getAzimuthalAngle();
          if (Math.abs(az) > COMFORT_WEDGE.maxAzimuth) {
            controls.setAzimuthalAngle(
              THREE.MathUtils.damp(
                az,
                Math.sign(az) * COMFORT_WEDGE.maxAzimuth,
                COMFORT_WEDGE.lambda,
                delta,
              ),
            );
          }
        }
      }
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

    // Pointer parallax: the world leans a hair's width toward the cursor.
    //
    // Disabled on touch, where it is not parallax at all. `state.pointer`
    // holds the LAST pointer position, and a finger that has lifted never
    // returns to centre — so on a phone this baked a permanent yaw/pitch
    // offset into the camera, whose size and direction depended on where
    // the user happened to last touch the screen. Damping to 0 rather
    // than skipping the block keeps the transition smooth if a mouse is
    // attached to a tablet mid-session.
    const p = parallax.current;
    const px = coarse ? 0 : state.pointer.x;
    const py = coarse ? 0 : state.pointer.y;
    p.x = THREE.MathUtils.damp(p.x, px, CAMERA_FEEL.parallaxDamping, delta);
    p.y = THREE.MathUtils.damp(p.y, py, CAMERA_FEEL.parallaxDamping, delta);
    camera.rotateY(-p.x * CAMERA_FEEL.parallaxYaw);
    camera.rotateX(p.y * CAMERA_FEEL.parallaxPitch);

    // Breathing: sub-quarter-degree fov oscillation.
    //
    // The aspect correction wraps the authored fov rather than replacing
    // it: `baseFov` stays the composed, aspect-independent intent (it is
    // what the flight timelines tween, including the mid-flight focus
    // pull), and the lens needed to realise that intent on THIS viewport
    // is derived here, every frame. Deriving per-frame rather than on a
    // resize listener means an orientation change or a desktop window
    // drag is already handled — camera.aspect is maintained by R3F.
    camera.fov =
      (authoredPose.current ? baseFov.current : framedFov(baseFov.current, camera.aspect)) +
      Math.sin(t * CAMERA_FEEL.breatheSpeed * Math.PI * 2) * CAMERA_FEEL.breatheAmplitude;
    camera.updateProjectionMatrix();
  });

  // The opening pose has to be resolved too, or a phone would sit on the
  // landscape reveal until the first dock tap flew it somewhere authored.
  // Assigned in an effect rather than in the render body: the ref tracks
  // the pose we are CURRENTLY on, which flights reassign, so writing it
  // every render would clobber a flight's value on the next re-render.
  const home = resolveView(CAMERA_VIEWS[DEFAULT_VIEW], camera.aspect);
  const homeAuthored = home.authored;
  useEffect(() => {
    authoredPose.current = homeAuthored;
    // mount only — later changes belong to whichever flight caused them
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      target={home.target}
      enableDamping
      dampingFactor={0.045}
      // no pan: it drags the look-target out of the composition
      // envelope (every clamp is target-relative) — orbit + dolly
      // covers all exploration; flights handle re-targeting
      enablePan={false}
      // No dolly on touch. Pinch-zoom is the only forward/backward the
      // rig exposes, and on a phone it is a liability: it is easy to
      // trigger accidentally while rotating, it can park the camera at a
      // radius the portrait poses were never composed for, and there is
      // no cheap way back. With it off, a phone gets exactly one verb —
      // drag to rotate — pivoting the room-centre anchor that
      // COMFORT_WEDGE already glides the look-target to on manual
      // takeover. Distance is then owned entirely by the dock flights,
      // which is why the dock had to become fully reachable first.
      enableZoom={!coarse}
      rotateSpeed={coarse ? 0.55 : 0.38}
      zoomSpeed={0.5}
      minDistance={ORBIT_LIMITS.minDistance}
      maxDistance={ORBIT_LIMITS.maxDistance}
      minPolarAngle={ORBIT_LIMITS.minPolarAngle}
      maxPolarAngle={ORBIT_LIMITS.maxPolarAngle}
      minAzimuthAngle={ORBIT_LIMITS.minAzimuthAngle}
      maxAzimuthAngle={ORBIT_LIMITS.maxAzimuthAngle}
    />
  );
}
