"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { SceneObject } from "@/lib/interactive/SceneObject";
import { AssetModel, MODEL_URLS } from "./models/AssetModel";
import { DESK } from "./Desk";

/**
 * Articulated desk lamp (Poly Haven, CC0) anchoring the desk's left
 * end, with a warm practical pool — the counterpoint to the monitor's
 * cool glow.
 */
export function DeskLamp() {
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0, DESK.surfaceY, -1.6);
    return o;
  }, []);

  return (
    <>
      <SceneObject
        def={{ id: "desk-lamp", name: "Desk Lamp", cameraView: "desk" }}
        position={[-1.05, DESK.surfaceY, -2.05]}
        // yaw chosen so the articulated head reaches over and points AT
        // the workspace (keyboard/monitor to the lamp's right), not away
        rotation={[0, -2.4, 0]}
      >
        <AssetModel url={MODEL_URLS.deskLamp} />
      </SceneObject>
      <primitive object={target} />
      <spotLight
        position={[-0.6, 1.15, -1.9]}
        target={target}
        angle={0.65}
        penumbra={0.6}
        intensity={3.2}
        distance={4.0}
        decay={2}
        color="#ffc98f"
      />
    </>
  );
}
