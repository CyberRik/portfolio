import type { Vector3Tuple } from "three";
import type { CameraViewId } from "@/config/camera.config";

/**
 * Phase 2 contract. Every scene object that becomes interactive
 * registers one of these. The renderer (SceneObject) already wires
 * ids and groups — Phase 2 only adds behavior.
 */
export interface InteractiveObjectDef {
  /** Stable unique id, e.g. "monitor", "bookshelf" */
  id: string;
  /** Human-readable label for tooltips / HUD */
  name: string;
  /** Named camera view to fly to when focused */
  cameraView?: CameraViewId;
  /** Explicit camera override when a named view isn't enough */
  cameraTarget?: { position: Vector3Tuple; target: Vector3Tuple };
  /** Arbitrary payload: project data, links, copy, etc. */
  metadata?: Record<string, unknown>;
}

export interface InteractiveHandlers {
  onHover?: (id: string, hovered: boolean) => void;
  onClick?: (id: string) => void;
}
