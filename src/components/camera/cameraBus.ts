import type { CameraViewId } from "@/config/camera.config";

/**
 * Imperative bridge to the CameraRig. The rig registers its flyTo at
 * mount; UI or Phase 2 interactions call `flyToView("server")` from
 * anywhere without prop-drilling through the canvas boundary.
 */
type FlyTo = (view: CameraViewId, duration?: number) => void;

let flyToImpl: FlyTo | null = null;

export function registerFlyTo(fn: FlyTo | null) {
  flyToImpl = fn;
}

export function flyToView(view: CameraViewId, duration?: number) {
  flyToImpl?.(view, duration);
}
