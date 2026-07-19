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
 *
 * The light lives INSIDE the lamp's group, at the head, aimed in the
 * lamp's local frame. It used to be a world-space spotLight placed by
 * hand next to the lamp, which meant the beam and the object it was
 * meant to come from could drift apart — and had: the head pointed off
 * the desk while the pool sat 45cm to its right, lit from mid-air.
 * Parented like this, re-aiming the lamp re-aims the light for free.
 *
 * The asset's head faces local +X. That is what fixes the yaw: rotating
 * by θ sends the head to (cos θ, 0, −sin θ), so to look at a point the
 * yaw is atan2(−dz, dx) — not a number to be found by trial.
 */

/** local head position — top of the arm, ~0.46m above the desk */
const HEAD: [number, number, number] = [0.15, 0.46, 0];
/** local aim point: on the desk surface (group origin sits at surfaceY),
 *  0.76m out along the head's facing — the pool lands on the work area */
const AIM: [number, number, number] = [0.76, 0, 0];

/** look from the lamp toward the keyboard side of the desk */
const YAW = Math.atan2(-0.35, 1.05); // ≈ -0.32 rad

export function DeskLamp() {
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(...AIM);
    return o;
  }, []);

  return (
    <SceneObject
      def={{ id: "desk-lamp", name: "Desk Lamp", cameraView: "desk" }}
      position={[-1.05, DESK.surfaceY, -2.05]}
      rotation={[0, YAW, 0]}
    >
      <AssetModel url={MODEL_URLS.deskLamp} />
      {/* both in lamp-local space, so they travel with the head */}
      <primitive object={target} />
      <spotLight
        position={HEAD}
        target={target}
        angle={0.6}
        penumbra={0.5}
        intensity={3.2}
        distance={4.0}
        decay={2}
        color="#ffc98f"
      />
    </SceneObject>
  );
}
