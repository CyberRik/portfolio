import type { Vector3Tuple } from "three";
import type { CameraViewId } from "@/config/camera.config";

/**
 * Imperative bridge to the CameraRig. The rig registers its handlers at
 * mount; UI or scene objects call `flyToView("server")` / `flyToPose(...)`
 * from anywhere without prop-drilling through the canvas boundary.
 */
type FlyTo = (view: CameraViewId, duration?: number) => void;
type FlyToPose = (position: Vector3Tuple, target: Vector3Tuple, duration?: number) => void;

let flyToImpl: FlyTo | null = null;
let flyToPoseImpl: FlyToPose | null = null;

export function registerFlyTo(fn: FlyTo | null) {
  flyToImpl = fn;
}

export function flyToView(view: CameraViewId, duration?: number) {
  flyToImpl?.(view, duration);
}

export function registerFlyToPose(fn: FlyToPose | null) {
  flyToPoseImpl = fn;
}

export function flyToPose(position: Vector3Tuple, target: Vector3Tuple, duration?: number) {
  flyToPoseImpl?.(position, target, duration);
}
