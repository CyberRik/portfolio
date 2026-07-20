import type { Vector3Tuple } from "three";
import { isPortrait } from "@/lib/framing";

export interface CameraView {
  id: string;
  position: Vector3Tuple;
  target: Vector3Tuple;
  fov?: number;
  /**
   * Composition for viewports taller than they are wide, used verbatim
   * (see resolveView). Portrait is not a variation on the landscape shot
   * — it is a different shot, because the geometry does not permit a
   * compromise: this room is ~6m wide and ~2.8m tall, and a 9:19.5 frame
   * showing its full HEIGHT can only show ~1.2m of its WIDTH. Widening
   * the lens far enough to recover the width fills the extra vertical
   * angle with dead floor and dark ceiling instead (which is exactly what
   * the first portrait screenshot showed).
   *
   * So these poses stop trying to reproduce the diorama reveal and frame
   * their subject instead: closer, lower, aimed so the back wall fills
   * the top of the frame and the desk sits on the centre line.
   */
  portrait?: {
    position: Vector3Tuple;
    target: Vector3Tuple;
    fov?: number;
  };
}

/** A pose resolved for an actual viewport. */
export interface ResolvedView {
  position: Vector3Tuple;
  target: Vector3Tuple;
  fov?: number;
  /**
   * True when the pose was composed for this viewport's shape and must
   * be flown as authored. The aspect fov-correction in lib/framing is a
   * fallback for poses that were NOT authored for the current shape;
   * applying it on top of an authored portrait pose would re-widen a
   * lens that was already chosen deliberately.
   */
  authored: boolean;
}

export function resolveView(v: CameraView, aspect: number): ResolvedView {
  if (v.portrait && isPortrait(aspect)) {
    return { ...v.portrait, authored: true };
  }
  return { position: v.position, target: v.target, fov: v.fov, authored: false };
}

/**
 * Named cinematic views. Phase 2 interactions will tween the camera
 * between these via the CameraRig's imperative API.
 */
export const CAMERA_VIEWS = {
  /**
   * Opening shot: low 3/4 angle, monitor centered against the dusk
   * window, desk lamp pool camera-left, rack glow camera-right.
   * Low camera height = intimate; long-ish lens = expensive.
   */
  /**
   * Opening shot: pulled back so the whole diorama reads against the
   * night-city panorama — the reveal, then the user leans in.
   */
  overview: {
    id: "overview",
    position: [2.9, 2.6, 5.9],
    target: [0, 1.0, -1.3],
    fov: 42,
    // lower and much closer than the landscape reveal: at 2.6m up the
    // extra vertical angle lands on empty floor, so the portrait shot
    // drops to desk height and lets the back wall carry the top third
    portrait: {
      position: [1.5, 1.7, 3.2],
      target: [0, 1.15, -1.6],
      fov: 48,
    },
  },
  desk: {
    id: "desk",
    position: [0, 1.45, 0.75],
    target: [0, 1.08, -1.85],
    fov: 42,
    // pulled back to ~3.6m: the monitor is 1.44m wide and the landscape
    // pose's 2.6m standoff only spans ~0.9m of width once the frame is
    // this narrow, which would crop the screen on both sides
    portrait: {
      position: [0, 1.35, 1.75],
      target: [0, 1.08, -1.85],
      fov: 55,
    },
  },
  bookshelf: {
    id: "bookshelf",
    // a tall subject in a tall frame — the one view portrait flatters,
    // so it needs the least pullback of the six
    position: [-1.7, 1.6, -0.2],
    target: [-3.65, 1.45, -1.2],
    fov: 45,
    portrait: {
      position: [-0.98, 1.65, 0.17],
      target: [-3.65, 1.45, -1.2],
      fov: 50,
    },
  },
  server: {
    id: "server",
    position: [1.5, 1.35, -0.3],
    target: [3.25, 1.1, -2.15],
    fov: 45,
    portrait: {
      position: [0.65, 1.47, 0.6],
      target: [3.25, 1.1, -2.15],
      fov: 55,
    },
  },
  whiteboard: {
    id: "whiteboard",
    position: [1.7, 1.6, 0.9],
    target: [3.9, 1.65, 0.5],
    fov: 45,
    portrait: {
      position: [0.5, 1.6, 1.15],
      target: [3.9, 1.6, 0.5],
      fov: 58,
    },
  },
  window: {
    id: "window",
    position: [0.2, 1.75, -0.2],
    target: [0, 1.9, -3.4],
    fov: 50,
    portrait: {
      position: [0.26, 1.7, 0.79],
      target: [0, 1.9, -3.4],
      fov: 55,
    },
  },
} as const satisfies Record<string, CameraView>;

export type CameraViewId = keyof typeof CAMERA_VIEWS;

export const DEFAULT_VIEW: CameraViewId = "overview";

/**
 * Orbit constraints — cinematic, never lets the user break the illusion.
 * maxDistance keeps the camera INSIDE the (now fully enclosed) room.
 */
/**
 * Polar floor keeps the camera from climbing into a dead top-down
 * angle where the roof fills the frame; distance cap keeps the
 * diorama compositionally dominant against the panorama.
 */
export const ORBIT_LIMITS = {
  minDistance: 1.8,
  maxDistance: 8.2,
  // generous static floor — the CameraRig's per-frame height ceiling
  // (camera.y ≤ roofline) is what actually prevents top-down views
  minPolarAngle: Math.PI * 0.24,
  maxPolarAngle: Math.PI * 0.53,
  // wide enough that the authored wall-facing views (whiteboard az
  // ≈ −0.44π, bookshelf ≈ 0.35π) are NOT bent by OrbitControls'
  // per-update clamp mid-flight; kept under ±π/2 so the CameraRig's
  // positional plane clamps stay in their valid trig branch
  minAzimuthAngle: -Math.PI * 0.45,
  maxAzimuthAngle: Math.PI * 0.45,
} as const;

/**
 * Comfort wedge + centre pivot.
 *
 * Flights orbit whatever they were authored to look at (whiteboard,
 * desk, …) and hold their pose. But the moment the USER takes manual
 * control, the look-target glides home to the room's central anchor —
 * so all free orbiting and scrolling pivots around the room itself and
 * the whole diorama stays in view (the "turntable" model). On top of
 * that, once input goes quiet, azimuth parked outside the comfort band
 * eases back inside — an operator quietly re-framing. Nothing is ever
 * irreversibly stuck.
 */
export const COMFORT_WEDGE = {
  /** azimuth band the camera settles back into (rad) */
  maxAzimuth: Math.PI * 0.3,
  /** seconds of quiet input before the azimuth glide-back engages */
  settleDelay: 1.6,
  /** damping lambda — small = slow, cinematic return */
  lambda: 0.9,
  /** the fixed pivot manual exploration orbits around (room centre) */
  anchor: [0, 1.0, -1.3] as Vector3Tuple,
  /** how fast the pivot glides home after manual takeover */
  anchorLambda: 1.4,
} as const;

/** Idle drift applied on top of the orbit position when the user is inactive. */
export const IDLE_DRIFT = {
  amplitude: 0.12,
  speed: 0.16,
  resumeDelay: 3.5, // seconds of inactivity before drift resumes
} as const;

/** Handcrafted micro-motion — always on, below conscious notice. */
export const CAMERA_FEEL = {
  /** fov breathing amplitude in degrees */
  breatheAmplitude: 0.18,
  breatheSpeed: 0.14,
  /** pointer parallax in radians at full deflection */
  parallaxYaw: 0.008,
  parallaxPitch: 0.005,
  /** how fast the parallax eases toward the pointer (damping lambda) */
  parallaxDamping: 1.6,
} as const;
