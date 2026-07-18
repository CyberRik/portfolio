"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import { materials } from "@/lib/materials";
import { plankAlbedo, plankRoughness } from "@/lib/textures";
import { Bx } from "@/components/objects/primitives";

/**
 * Architectural shell: floor, three walls, ceiling, baseboards.
 * Back wall (z = -3.2) carries the window cutout — built as four slabs
 * framing a 2.8 x 1.5 opening centered at y = 1.9.
 *
 * The floor is the room's mirror: wide oak planks with a soft blurred
 * reflection (MeshReflectorMaterial) so the monitor glow, window dusk
 * and lamp pool all smear gently across the wood.
 */
export const ROOM = {
  width: 8,
  height: 3.2,
  depth: 6.4,
  window: { width: 2.8, height: 1.5, centerY: 1.9 },
} as const;

export function Room() {
  const { width: W, height: H, depth: D, window: win } = ROOM;
  const halfD = D / 2;
  const winBottom = win.centerY - win.height / 2;
  const winTop = win.centerY + win.height / 2;
  const sideW = (W - win.width) / 2;

  return (
    <group name="room">
      {/* Floor — reflective oak */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <MeshReflectorMaterial
          map={plankAlbedo()}
          roughnessMap={plankRoughness()}
          roughness={0.85}
          metalness={0}
          resolution={512}
          mixBlur={6}
          mixStrength={2.2}
          blur={[280, 90]}
          mirror={0.42}
          depthScale={0.6}
          minDepthThreshold={0.7}
          maxDepthThreshold={1.6}
          color="#ffffff"
        />
      </mesh>

      {/* Ceiling */}
      <Bx position={[0, H + 0.05, 0]} scale={[W, 0.1, D]} material={materials.ceiling} castShadow={false} />

      {/* Back wall — four slabs around the window opening */}
      <Bx position={[-(win.width / 2 + sideW / 2), H / 2, -halfD]} scale={[sideW, H, 0.15]} material={materials.wall} />
      <Bx position={[win.width / 2 + sideW / 2, H / 2, -halfD]} scale={[sideW, H, 0.15]} material={materials.wall} />
      <Bx position={[0, winBottom / 2, -halfD]} scale={[win.width, winBottom, 0.15]} material={materials.wall} />
      <Bx position={[0, (H + winTop) / 2, -halfD]} scale={[win.width, H - winTop, 0.15]} material={materials.wall} />

      {/* Side walls */}
      <Bx position={[-W / 2, H / 2, 0]} scale={[0.15, H, D]} material={materials.wallAccent} />
      <Bx position={[W / 2, H / 2, 0]} scale={[0.15, H, D]} material={materials.wallAccent} />

      {/* Open front — the room reads as a cutaway diorama against the
          city panorama. Dark outer skins keep the shell clean from
          outside angles. */}
      <Bx position={[0, H / 2, -halfD - 0.1]} scale={[W + 0.24, H + 0.12, 0.06]} material={materials.shell} castShadow={false} />
      <Bx position={[-W / 2 - 0.1, H / 2, 0]} scale={[0.06, H + 0.12, D + 0.24]} material={materials.shell} castShadow={false} />
      <Bx position={[W / 2 + 0.1, H / 2, 0]} scale={[0.06, H + 0.12, D + 0.24]} material={materials.shell} castShadow={false} />
      <Bx position={[0, H + 0.13, 0]} scale={[W + 0.24, 0.06, D + 0.24]} material={materials.roof} castShadow={false} />

      {/* Rooftop dressing — HVAC units + vent, so top-down angles read
          as a penthouse roof, not a bare slab */}
      <group position={[0, H + 0.16, 0]}>
        <Bx position={[2.4, 0.19, -1.1]} scale={[0.75, 0.38, 0.55]} material={materials.metalMid} castShadow={false} />
        <Bx position={[2.4, 0.395, -1.1]} scale={[0.65, 0.03, 0.45]} material={materials.metalDark} castShadow={false} />
        <Bx position={[-2.6, 0.14, 0.9]} scale={[0.55, 0.28, 0.45]} material={materials.metalMid} castShadow={false} />
        <mesh position={[-1.4, 0.14, -2.0]}>
          <cylinderGeometry args={[0.1, 0.13, 0.3, 12]} />
          <primitive object={materials.metalDark} attach="material" />
        </mesh>
        {/* aviation beacon */}
        <mesh position={[2.4, 0.44, -1.1]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshBasicMaterial color="#ff4444" toneMapped={false} />
        </mesh>
      </group>

      {/* Display plinth under the floor — architectural-model base with
          a warm under-glow line */}
      <Bx position={[0, -0.12, 0]} scale={[W + 0.3, 0.14, D + 0.3]} material={materials.shell} castShadow={false} />
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[W + 0.5, 0.02, D + 0.5]} />
        <meshStandardMaterial color="#000000" emissive="#ffb375" emissiveIntensity={0.7} />
      </mesh>
      <Bx position={[0, -0.34, 0]} scale={[W + 0.7, 0.26, D + 0.7]} material={materials.shell} castShadow={false} />

      {/* Ceiling cove — warm recessed LED lines framing the ceiling,
          so the upper third reads as architecture, not dead space */}
      {([
        [0, -halfD + 0.22, W - 0.8, 0.015] as const,
        [0, halfD - 0.22, W - 0.8, 0.015] as const,
      ]).map(([x, z, len], i) => (
        <mesh key={`cove-z-${i}`} position={[x, H - 0.035, z]}>
          <boxGeometry args={[len, 0.012, 0.015]} />
          <meshStandardMaterial color="#000000" emissive="#ffb375" emissiveIntensity={1.4} />
        </mesh>
      ))}
      {([-W / 2 + 0.22, W / 2 - 0.22] as const).map((x, i) => (
        <mesh key={`cove-x-${i}`} position={[x, H - 0.035, 0]}>
          <boxGeometry args={[0.015, 0.012, D - 0.8]} />
          <meshStandardMaterial color="#000000" emissive="#ffb375" emissiveIntensity={1.4} />
        </mesh>
      ))}

      {/* Baseboards */}
      <Bx position={[0, 0.06, -halfD + 0.09]} scale={[W, 0.12, 0.04]} material={materials.woodDark} />
      <Bx position={[-W / 2 + 0.09, 0.06, 0]} scale={[0.04, 0.12, D]} material={materials.woodDark} />
      <Bx position={[W / 2 - 0.09, 0.06, 0]} scale={[0.04, 0.12, D]} material={materials.woodDark} />

      {/* Rug under the desk zone — smaller now so the oak reflections read */}
      <mesh position={[0, 0.011, -0.75]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.4, 2.3]} />
        <meshStandardMaterial color="#262019" roughness={1} />
      </mesh>
    </group>
  );
}
