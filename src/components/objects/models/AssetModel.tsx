"use client";

import { Clone, useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";

/**
 * Shared wrapper for downloaded GLTF assets (Poly Haven CC0 + Khronos
 * samples — see public/models/README.md). Clone reuses the cached
 * geometry/materials, so placing an asset twice costs no extra VRAM.
 */
type AssetModelProps = ThreeElements["group"] & {
  url: string;
};

export function AssetModel({ url, ...groupProps }: AssetModelProps) {
  const { scene } = useGLTF(url);
  return (
    <group {...groupProps}>
      <Clone object={scene} castShadow receiveShadow />
    </group>
  );
}

export const MODEL_URLS = {
  pottedPlantLarge: "/models/potted_plant_04/potted_plant_04_1k.gltf",
  pottedPlantSmall: "/models/potted_plant_01/potted_plant_01_1k.gltf",
  deskLamp: "/models/desk_lamp_arm_01/desk_lamp_arm_01_1k.gltf",
  encyclopedias: "/models/book_encyclopedia_set_01/book_encyclopedia_set_01_1k.gltf",
  loungeChair: "/models/mid_century_lounge_chair/mid_century_lounge_chair_1k.gltf",
  coffeeTable: "/models/coffee_table_round_01/coffee_table_round_01_1k.gltf",
  pictureFrame2: "/models/fancy_picture_frame_01/fancy_picture_frame_01_1k.gltf",
  pictureFrame3: "/models/fancy_picture_frame_02/fancy_picture_frame_02_1k.gltf",
  sheenChair: "/models/sheen_chair/SheenChair.glb",
} as const;

// Warm the cache as soon as the module is parsed
Object.values(MODEL_URLS).forEach((u) => useGLTF.preload(u));
