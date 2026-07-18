"use client";

import { SceneObject } from "@/lib/interactive/SceneObject";
import { AssetModel, MODEL_URLS } from "./models/AssetModel";

/**
 * Real framed pieces (Poly Haven hanging frames, CC0).
 * Left wall pair over the reading corner + one on the back wall.
 * Each registers individually so Phase 2 can attach a credential/story.
 */
export function WallFrames() {
  return (
    <group name="wall-frames">
      <SceneObject
        def={{ id: "frame-1", name: "Framed Print" }}
        position={[-3.9, 1.75, 0.35]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <AssetModel url={MODEL_URLS.pictureFrame2} />
      </SceneObject>
      <SceneObject
        def={{ id: "frame-2", name: "Framed Print" }}
        position={[-3.9, 1.6, 1.25]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <AssetModel url={MODEL_URLS.pictureFrame3} />
      </SceneObject>
      {/* back wall stays clean — a frame there read as a black void
          against the dark plaster */}
    </group>
  );
}
