import type { Vector3Tuple } from "three";
import type { CameraViewId } from "@/config/camera.config";

/**
 * Imperative bridge to the CameraRig. The rig registers its handlers at
 * mount; UI or scene objects call `flyToView("server")` / `flyToPose(...)`
 * from anywhere without prop-drilling through the canvas boundary.
 */
export interface FlightMeta {
  id: string;
  name: string;
}

type FlyTo = (view: CameraViewId, duration?: number, meta?: FlightMeta) => void;
type FlyToPose = (
  position: Vector3Tuple,
  target: Vector3Tuple,
  duration?: number,
  meta?: FlightMeta,
) => void;

let flyToImpl: FlyTo | null = null;
let flyToPoseImpl: FlyToPose | null = null;
let portalDepthImpl: ((active: boolean) => void) | null = null;

export function registerFlyTo(fn: FlyTo | null) {
  flyToImpl = fn;
}

export function flyToView(view: CameraViewId, duration?: number, meta?: FlightMeta) {
  flyToImpl?.(view, duration, meta);
}

export function registerFlyToPose(fn: FlyToPose | null) {
  flyToPoseImpl = fn;
}

export function flyToPose(
  position: Vector3Tuple,
  target: Vector3Tuple,
  duration?: number,
  meta?: FlightMeta,
) {
  flyToPoseImpl?.(position, target, duration, meta);
}

export function registerPortalDepth(fn: ((active: boolean) => void) | null) {
  portalDepthImpl = fn;
}

/**
 * Portal experiences dolly the camera INSIDE OrbitControls' normal
 * minDistance (which clamps the radius every update, even mid-flight).
 * While a portal is open the rig relaxes the floor; it restores it
 * only after the exit flight lands, so the pose never snaps.
 */
export function setPortalDepth(active: boolean) {
  portalDepthImpl?.(active);
}
