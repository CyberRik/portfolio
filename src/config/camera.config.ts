import type { Vector3Tuple } from "three";

export interface CameraView {
  id: string;
  position: Vector3Tuple;
  target: Vector3Tuple;
  fov?: number;
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
  },
  desk: {
    id: "desk",
    position: [0, 1.45, 0.75],
    target: [0, 1.08, -1.85],
    fov: 42,
  },
  bookshelf: {
    id: "bookshelf",
    position: [-1.7, 1.6, -0.2],
    target: [-3.65, 1.45, -1.2],
    fov: 45,
  },
  server: {
    id: "server",
    position: [1.5, 1.35, -0.3],
    target: [3.25, 1.1, -2.15],
    fov: 45,
  },
  whiteboard: {
    id: "whiteboard",
    position: [1.7, 1.6, 0.9],
    target: [3.9, 1.65, 0.5],
    fov: 45,
  },
  window: {
    id: "window",
    position: [0.2, 1.75, -0.2],
    target: [0, 1.9, -3.4],
    fov: 50,
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
