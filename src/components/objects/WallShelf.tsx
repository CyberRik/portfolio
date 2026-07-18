"use client";

import { materials, emissive } from "@/lib/materials";
import { Bx } from "./primitives";
import { SceneObject } from "@/lib/interactive/SceneObject";

/**
 * Floating wall shelves on the back wall (right of the window)
 * with small decor: a tiny plant, a figure, a warm LED strip underneath.
 */
export function WallShelf() {
  return (
    <SceneObject def={{ id: "wall-shelf", name: "Shelves" }} position={[2.4, 0, -3.12]}>
      {[1.6, 2.1].map((y, i) => (
        <group key={y} position={[0, y, 0]}>
          <Bx position={[0, 0, 0.14]} scale={[1.1, 0.035, 0.24]} material={materials.woodLight} />
          {/* Under-shelf warm LED strip */}
          <Bx position={[0, -0.024, 0.2]} scale={[1.0, 0.006, 0.01]} material={emissive("#ffb375", 0.65)} castShadow={false} />
          {i === 0 ? (
            <>
              {/* small books */}
              <Bx position={[-0.35, 0.09, 0.14]} scale={[0.03, 0.14, 0.11]} material={materials.mug} />
              <Bx position={[-0.31, 0.085, 0.14]} scale={[0.03, 0.13, 0.11]} material={materials.fabric} />
              <Bx position={[-0.27, 0.095, 0.14]} scale={[0.03, 0.15, 0.11]} material={materials.woodDark} />
              {/* tiny succulent */}
              <mesh position={[0.3, 0.05, 0.14]} castShadow>
                <cylinderGeometry args={[0.045, 0.035, 0.07, 12]} />
                <primitive object={materials.plantPot} attach="material" />
              </mesh>
              <mesh position={[0.3, 0.11, 0.14]} castShadow>
                <sphereGeometry args={[0.04, 8, 6]} />
                <primitive object={materials.plantGreen} attach="material" />
              </mesh>
            </>
          ) : (
            <>
              {/* desk toy / awards */}
              <Bx position={[0.25, 0.07, 0.14]} scale={[0.06, 0.1, 0.06]} material={materials.metalMid} />
              <mesh position={[-0.2, 0.06, 0.14]} castShadow>
                <icosahedronGeometry args={[0.05, 0]} />
                <primitive object={materials.metalDark} attach="material" />
              </mesh>
            </>
          )}
        </group>
      ))}
    </SceneObject>
  );
}
