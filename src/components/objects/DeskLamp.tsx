"use client";

import { SceneObject } from "@/lib/interactive/SceneObject";
import { AssetModel, MODEL_URLS } from "./models/AssetModel";
import { DESK } from "./Desk";

/**
 * Articulated desk lamp (Poly Haven, CC0) anchoring the desk's left
 * end, with a warm practical pool — the counterpoint to the monitor's
 * cool glow.
 */
export function DeskLamp() {
  return (
    <SceneObject
      def={{ id: "desk-lamp", name: "Desk Lamp", cameraView: "desk" }}
      position={[-1.05, DESK.surfaceY, -2.05]}
      rotation={[0, 0.7, 0]}
    >
      <AssetModel url={MODEL_URLS.deskLamp} />
      <pointLight
        position={[0.35, 0.35, 0.15]}
        intensity={1.6}
        distance={1.8}
        decay={2}
        color="#ffc98f"
      />
    </SceneObject>
  );
}
