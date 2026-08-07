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
/**
 * Azimuth envelope for touch, wider than the desktop wedge.
 *
 * The whiteboard (+X wall, z≈0.5) needs about ±84° of azimuth before it
 * clears the frame edge: at the old ±81° static limit it sat 19.6° off
 * axis against a 14.7° half-fov on a phone — 5° short, i.e. permanently
 * just out of reach no matter how far you dragged. Portrait is what
 * makes this bite; the same pose frames it comfortably on a landscape
 * viewport, which is why it was never visible on desktop.
 *
 * Safe to widen only because the touch envelope now solves for radius
 * (see the clamp in useFrame): that formulation is valid in every
 * quadrant, unlike the desktop `asin` clamps which need |az| < π/2 to
 * stay in branch. The room stays enclosed at these angles because the
 * side-plane and back-plane limits still bound the radius.
 */
const TOUCH_AZ_LIMIT = Math.PI * 0.62;
/**
 * And the comfort wedge has to widen with it. Left at ±0.3π the rig
 * spent 1.6s of quiet input dragging the user back off the very wall
 * they had just turned to look at — measured easing −79.5° → −73.7°.
 * Self-recovery should rescue a lost camera, not overrule an intent.
 */
const TOUCH_COMFORT_AZ = Math.PI * 0.55;

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
  /**
   * The radius free orbit wants to sit at — the distance of the pose we
   * last flew to. The touch envelope pulls the camera INSIDE this when a
   * wall is in the way and eases back out to it when the way is clear,
   * so swinging through a corner and back returns to the framing that
   * was authored rather than ratcheting permanently closer.
   */
  const restRadius = useRef(0);

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
      // Taken from the pose itself, not from the camera on arrival: the
      // look-target is still easing to the anchor when the flight lands,
      // so measuring then would bake the transient distance in.
      restRadius.current = p1.distanceTo(t1);

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

      /**
       * Touch: keep the RADIUS inside the envelope instead of the angle.
       *
       * The clamps below stop the azimuth dead once the camera reaches a
       * wall plane, which measured as a hard stop at camera.x = 3.4 —
       * ±45.7° of total sweep on a phone (±26° on desktop). On desktop
       * that is survivable because dollying in shrinks `horiz`, and the
       * angular limit is `asin(MAX_CAM_X / horiz)` — so zooming buys back
       * rotation. Touch has no dolly by design, so the same stop is a
       * dead end: the room simply refuses to turn any further.
       *
       * So on touch the constraint is solved for radius rather than
       * angle. The camera slides closer to the pivot as it swings toward
       * a wall and back out as it returns, tracing the room's envelope
       * instead of stopping at it. Rotation stays free across the full
       * static ±0.45π. This is not the dolly that was removed — the user
       * cannot drive it, it is the rig staying inside the box.
       */
      if (coarse && horiz > 1e-4) {
        const az = controls.getAzimuthalAngle();
        const sinAz = Math.sin(az);
        const cosAz = Math.cos(az);
        const tx = controls.target.x;
        const tz = controls.target.z;

        let maxHoriz = Infinity;
        // camera.x = tx + horiz·sin(az), bounded by both side planes
        if (sinAz > 1e-4) maxHoriz = Math.min(maxHoriz, (MAX_CAM_X - tx) / sinAz);
        if (sinAz < -1e-4) maxHoriz = Math.min(maxHoriz, (-MAX_CAM_X - tx) / sinAz);
        // camera.z = tz + horiz·cos(az), bounded by the rear wall
        if (cosAz < -1e-4) maxHoriz = Math.min(maxHoriz, (MIN_CAM_Z - tz) / cosAz);

        const sinPolar = Math.sin(controls.getPolarAngle());
        if (sinPolar > 1e-4 && restRadius.current > 0) {
          // Never below the orbit floor: pulling closer than minDistance
          // would put the camera inside the furniture.
          const allowed = Number.isFinite(maxHoriz)
            ? Math.max(maxHoriz / sinPolar, ORBIT_LIMITS.minDistance)
            : Infinity;
          const wanted = Math.min(restRadius.current, allowed);

          // Deliberately asymmetric. Tightening is INSTANT, because it is
          // the thing standing between the camera and the inside of a
          // wall — a damped approach would let a fast swipe cross the
          // plane for a few frames and show the room's backface. Easing
          // back out is damped, because nothing is violated by being too
          // close, and snapping the framing outward the moment a corner
          // clears reads as a lurch.
          let next = dist;
          if (dist > allowed) next = allowed;
          else if (dist < wanted - 1e-3) next = THREE.MathUtils.damp(dist, wanted, 3.5, delta);

          if (next !== dist) {
            // Written straight onto the camera rather than through the
            // controls: OrbitControls derives its spherical from
            // (camera.position - target) at the top of every update(),
            // so moving the camera here is read as the new radius on the
            // very next update — which is called a few lines below.
            const dir = camera.position.clone().sub(controls.target).normalize();
            camera.position.copy(controls.target).addScaledVector(dir, next);
          }
        }
      } else if (horiz > 1e-4) {
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
          const comfortAz = coarse ? TOUCH_COMFORT_AZ : COMFORT_WEDGE.maxAzimuth;
          if (Math.abs(az) > comfortAz) {
            controls.setAzimuthalAngle(
              THREE.MathUtils.damp(
                az,
                Math.sign(az) * comfortAz,
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
    // Seed the orbit radius from the opening pose. Without this the
    // touch envelope has no radius to ease back out to until the first
    // dock flight, so an initial swing to a wall would tighten the shot
    // and stay there.
    restRadius.current = new THREE.Vector3(...home.position).distanceTo(
      new THREE.Vector3(...home.target),
    );
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
      minAzimuthAngle={coarse ? -TOUCH_AZ_LIMIT : ORBIT_LIMITS.minAzimuthAngle}
      maxAzimuthAngle={coarse ? TOUCH_AZ_LIMIT : ORBIT_LIMITS.maxAzimuthAngle}
    />
  );
}
