"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { materials, emissive, HAIRLINE_MIN } from "@/lib/materials";
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
          {/* Under-shelf warm LED strip. Thickness is HAIRLINE_MIN, not a
              chosen look: at its old 6mm this 1m run rasterized to under a
              pixel and came out as a dashed line. Sits low enough that the
              taller housing still tucks under the shelf lip. */}
          <Bx position={[0, -0.029, 0.2]} scale={[1.0, HAIRLINE_MIN, 0.014]} material={emissive("#ffb375", 0.65)} castShadow={false} />
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
              <D20 position={[-0.2, 0.085, 0.14]} />
            </>
          )}
        </group>
      ))}
    </SceneObject>
  );
}

/**
 * The d20 on the top shelf. Click it and it rolls.
 *
 * It was already an icosahedron sitting there as unexplained decor, and
 * an icosahedron has twenty faces, so the easter egg is really just
 * admitting what the shape already was.
 *
 * Deliberately quiet: no sound, no particles, no modal. It spins, slows
 * on a fixed decay, and prints a number in the same monospace the rest
 * of the room uses. Roll a 20 and it says so — that's the whole payoff.
 * Anyone who never clicks it loses nothing.
 */
const SPIN = { start: 9, damping: 1.9, stop: 0.05, idle: 0.22 } as const;
/** big enough to read as a die from across the room, not so big it's furniture */
const R = 0.075;

function D20({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  const vel = useRef(0);
  const [face, setFace] = useState<number | null>(null);
  const [hovered, setHovered] = useState(false);
  const [nat20s, setNat20s] = useState(0);

  // The die swallows its own hover so the shelf doesn't light up and
  // announce it as a portal — which means it also has to supply its own
  // cursor, or it would be the one clickable thing in the room with no
  // affordance at all. "grab" reads as "pick this up and roll it".
  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = "grab";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  useFrame((_, dt) => {
    const mesh = ref.current;
    if (!mesh) return;

    // At rest it turns slowly — the only moving object on the shelf, which
    // is what makes anyone look at it twice and try clicking.
    if (vel.current <= 0) {
      mesh.rotation.y += SPIN.idle * dt;
      return;
    }

    mesh.rotation.x += vel.current * dt * 3.1;
    mesh.rotation.y += vel.current * dt * 4.3;

    // frame-rate independent decay, so it settles the same on any display
    vel.current *= Math.exp(-SPIN.damping * dt);

    if (vel.current < SPIN.stop) {
      vel.current = 0;
      const rolled = 1 + Math.floor(Math.random() * 20);
      setFace(rolled);
      if (rolled === 20) setNat20s((n) => n + 1);
    }
  });

  const roll = (e: { stopPropagation: () => void }) => {
    e.stopPropagation(); // the shelf behind it shouldn't take the click
    if (vel.current > 0) return; // already rolling
    setFace(null);
    vel.current = SPIN.start;
  };

  const crit = face === 20;

  return (
    <group position={position}>
      <mesh
        ref={ref}
        castShadow
        scale={hovered ? 1.12 : 1}
        onClick={roll}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <icosahedronGeometry args={[R, 0]} />
        <primitive object={materials.metalDark} attach="material" />
      </mesh>

      {/* a crit gets a warm bloom off the shelf, nothing more */}
      <pointLight
        position={[0, 0.04, 0.04]}
        color="#ffb361"
        distance={0.55}
        decay={2}
        intensity={crit ? 1.5 : 0}
      />

      {face !== null && (
        <Html center distanceFactor={1.6} position={[0, 0.13, 0]} zIndexRange={[20, 0]}>
          <div
            style={{
              fontFamily: "var(--font-mono, ui-monospace, monospace)",
              fontSize: 11,
              lineHeight: 1.35,
              letterSpacing: "0.06em",
              textAlign: "center",
              whiteSpace: "nowrap",
              padding: "3px 7px",
              borderRadius: 6,
              color: crit ? "#ffb361" : "#ece7dd",
              background: "rgba(12,10,9,0.82)",
              border: `1px solid ${crit ? "rgba(255,179,97,0.45)" : "rgba(255,255,255,0.10)"}`,
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            <div style={{ fontSize: 15 }}>{face}</div>
            {crit && <div style={{ fontSize: 8.5, opacity: 0.85 }}>natural 20</div>}
            {nat20s > 1 && crit && (
              <div style={{ fontSize: 8, opacity: 0.5 }}>×{nat20s}</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
