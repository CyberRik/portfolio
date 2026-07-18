"use client";

import { SceneObject } from "@/lib/interactive/SceneObject";
import { AssetModel, MODEL_URLS } from "./models/AssetModel";

/**
 * Khronos SheenChair sample (© Wayfair, CC-BY 4.0) — a fabric sling
 * designer chair. Pushed aside as if its owner just stood up, and out
 * of the desk camera's line of sight.
 */
export function DeskChair() {
  return (
    <SceneObject
      def={{ id: "chair", name: "Chair" }}
      position={[0.95, 0, -0.95]}
      rotation={[0, -2.3, 0]}
    >
      <AssetModel url={MODEL_URLS.sheenChair} />
    </SceneObject>
  );
}
