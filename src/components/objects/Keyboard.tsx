"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { materials, sharedBox } from "@/lib/materials";
import { Bx } from "./primitives";
import { SceneObject } from "@/lib/interactive/SceneObject";
import { DESK } from "./Desk";

/**
 * Mechanical keyboard — keycaps rendered as a single InstancedMesh
 * (one draw call for the whole key field).
 */
const ROWS = 5;
const COLS = 15;
const KEY = 0.028;
const GAP = 0.004;

export function Keyboard() {
  const y = DESK.surfaceY;

  const keys = useMemo(() => {
    const mesh = new THREE.InstancedMesh(sharedBox(), materials.keycap, ROWS * COLS);
    const m = new THREE.Matrix4();
    const s = new THREE.Vector3(KEY, 0.012, KEY);
    let i = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = (c - (COLS - 1) / 2) * (KEY + GAP);
        const z = (r - (ROWS - 1) / 2) * (KEY + GAP);
        m.compose(new THREE.Vector3(x, 0.017, z), new THREE.Quaternion(), s);
        mesh.setMatrixAt(i++, m);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    return mesh;
  }, []);

  return (
    <SceneObject
      def={{ id: "keyboard", name: "Mechanical Keyboard", cameraView: "desk" }}
      position={[0, y, -1.72]}
      rotation={[0, -0.02, 0]}
    >
      <Bx position={[0, 0.008, 0]} scale={[0.52, 0.024, 0.19]} material={materials.deviceBody} />
      <primitive object={keys} />
    </SceneObject>
  );
}
