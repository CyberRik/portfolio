"use client";

import { SceneObject } from "@/lib/interactive/SceneObject";
import { AssetModel, MODEL_URLS } from "./models/AssetModel";

/**
 * Mid-century lounge chair + round coffee table (Poly Haven, CC0)
 * under the arc floor lamp — turns the empty front-left floor into an
 * intentional reading corner instead of dead space.
 */
export function ReadingCorner() {
  return (
    <group name="reading-corner">
      <SceneObject
        def={{ id: "lounge-chair", name: "Lounge Chair" }}
        position={[-2.85, 0, 0.75]}
        rotation={[0, 1.05, 0]}
      >
        <AssetModel url={MODEL_URLS.loungeChair} />
      </SceneObject>
      <SceneObject
        def={{ id: "coffee-table", name: "Coffee Table" }}
        position={[-1.95, 0, 1.55]}
        scale={0.72}
      >
        <AssetModel url={MODEL_URLS.coffeeTable} />
      </SceneObject>
    </group>
  );
}
