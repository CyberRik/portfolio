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

// Models are Draco-compressed (geometry) + WebP (textures) via
// `gltf-transform optimize` — ~25MB of source assets ship as ~4MB.
// The decoder is self-hosted so first load has no CDN dependency.
const DRACO_PATH = "/draco/";

export function AssetModel({ url, ...groupProps }: AssetModelProps) {
  const { scene } = useGLTF(url, DRACO_PATH);
  return (
    <group {...groupProps}>
      <Clone object={scene} castShadow receiveShadow />
    </group>
  );
}

export const MODEL_URLS = {
  pottedPlantLarge: "/models/opt/potted_plant_04.glb",
  pottedPlantSmall: "/models/opt/potted_plant_01.glb",
  deskLamp: "/models/opt/desk_lamp_arm_01.glb",
  encyclopedias: "/models/opt/book_encyclopedia_set_01.glb",
  loungeChair: "/models/opt/mid_century_lounge_chair.glb",
  coffeeTable: "/models/opt/coffee_table_round_01.glb",
  pictureFrame2: "/models/opt/fancy_picture_frame_01.glb",
  pictureFrame3: "/models/opt/fancy_picture_frame_02.glb",
  sheenChair: "/models/opt/sheen_chair.glb",
} as const;

// Warm the cache as soon as the module is parsed
Object.values(MODEL_URLS).forEach((u) => useGLTF.preload(u, DRACO_PATH));
