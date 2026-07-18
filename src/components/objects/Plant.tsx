"use client";

import { SceneObject } from "@/lib/interactive/SceneObject";
import { AssetModel, MODEL_URLS } from "./models/AssetModel";

interface PlantProps {
  id: string;
  position: [number, number, number];
  scale?: number;
  variant?: "large" | "small";
  rotationY?: number;
}

/** Photoscanned potted plants (Poly Haven, CC0). Real-world scale. */
export function Plant({ id, position, scale = 1, variant = "large", rotationY = 0 }: PlantProps) {
  const url = variant === "large" ? MODEL_URLS.pottedPlantLarge : MODEL_URLS.pottedPlantSmall;
  return (
    <SceneObject def={{ id, name: "Plant" }} position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <AssetModel url={url} />
    </SceneObject>
  );
}
