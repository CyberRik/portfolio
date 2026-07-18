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
  overview: {
    id: "overview",
    position: [2.45, 1.65, 2.65],
    target: [-0.15, 1.05, -1.6],
    fov: 45,
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
export const ORBIT_LIMITS = {
  minDistance: 1.8,
  maxDistance: 5.0,
  minPolarAngle: Math.PI * 0.22,
  maxPolarAngle: Math.PI * 0.52,
  minAzimuthAngle: -Math.PI * 0.42,
  maxAzimuthAngle: Math.PI * 0.42,
  panBounds: 1.5,
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
