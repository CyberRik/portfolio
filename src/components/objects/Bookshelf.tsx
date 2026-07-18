"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { materials, sharedBox } from "@/lib/materials";
import { Bx } from "./primitives";
import { SceneObject } from "@/lib/interactive/SceneObject";
import { AssetModel, MODEL_URLS } from "./models/AssetModel";

/**
 * Tall bookshelf on the left wall. Books are one InstancedMesh with
 * per-instance color — a full shelf costs a single draw call.
 */
const BOOK_PALETTE = ["#7a4a3a", "#4a5a6b", "#5a6b4a", "#8a7a5a", "#3d3d4d", "#6b4a5a", "#9a8468", "#44585c"];
const SHELF_YS = [0.35, 0.8, 1.25, 1.7];

export function Bookshelf() {
  const books = useMemo(() => {
    const count = 96;
    const mesh = new THREE.InstancedMesh(
      sharedBox(),
      // warm gray base knocks the spine colors toward "aged paper"
      new THREE.MeshStandardMaterial({ color: "#8f8375", roughness: 0.85 }),
      count,
    );
    const m = new THREE.Matrix4();
    const color = new THREE.Color();
    const rng = (seed: number) => {
      let s = seed;
      return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
      };
    };
    const rand = rng(42);

    let i = 0;
    for (const shelfY of SHELF_YS) {
      let x = -0.62;
      while (x < 0.58 && i < count) {
        const w = 0.025 + rand() * 0.02;
        const h = 0.16 + rand() * 0.08;
        const lean = rand() > 0.92 ? 0.12 : 0;
        m.compose(
          new THREE.Vector3(x + w / 2, shelfY + h / 2 + 0.015, 0),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, lean)),
          new THREE.Vector3(w, h, 0.16),
        );
        mesh.setMatrixAt(i, m);
        color.set(BOOK_PALETTE[Math.floor(rand() * BOOK_PALETTE.length)]);
        mesh.setColorAt(i, color);
        x += w + 0.004 + (rand() > 0.8 ? 0.05 : 0);
        i++;
      }
    }
    mesh.count = i;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = true;
    return mesh;
  }, []);

  return (
    <SceneObject
      def={{ id: "bookshelf", name: "Bookshelf", cameraView: "bookshelf" }}
      position={[-3.75, 0, -1.2]}
      rotation={[0, Math.PI / 2, 0]}
    >
      {/* Carcass */}
      <Bx position={[0, 1.05, -0.1]} scale={[1.4, 2.1, 0.03]} material={materials.woodDark} />
      <Bx position={[-0.69, 1.05, 0]} scale={[0.03, 2.1, 0.24]} material={materials.woodDark} />
      <Bx position={[0.69, 1.05, 0]} scale={[0.03, 2.1, 0.24]} material={materials.woodDark} />
      <Bx position={[0, 2.11, 0]} scale={[1.4, 0.03, 0.24]} material={materials.woodDark} />
      <Bx position={[0, 0.015, 0]} scale={[1.4, 0.03, 0.24]} material={materials.woodDark} />
      {SHELF_YS.map((y) => (
        <Bx key={y} position={[0, y, 0]} scale={[1.36, 0.025, 0.22]} material={materials.woodLight} />
      ))}

      <primitive object={books} />

      {/* Real encyclopedia rows (Poly Haven, CC0) mixed into two shelves */}
      <AssetModel url={MODEL_URLS.encyclopedias} position={[-0.25, 0.815, 0.02]} />
      <AssetModel url={MODEL_URLS.encyclopedias} position={[0.2, 1.715, 0.02]} rotation={[0, Math.PI, 0]} />

      {/* A few horizontal stacked books + small object on top shelf */}
      <Bx position={[0.45, 1.75, 0]} scale={[0.14, 0.02, 0.2]} material={materials.mug} />
      <Bx position={[0.45, 1.77, 0]} scale={[0.12, 0.02, 0.18]} material={materials.fabric} />
    </SceneObject>
  );
}
