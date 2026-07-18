"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { materials, sharedBox } from "@/lib/materials";
import { Bx } from "./primitives";
import { SceneObject } from "@/lib/interactive/SceneObject";
import { useHoverGlow } from "@/lib/interactive/useHoverGlow";

/**
 * GPU / server rack. Status LEDs are a single InstancedMesh whose
 * per-instance colors are re-randomized on independent blink clocks —
 * reads as real network/disk activity.
 */
const LED_ROWS = 6;
const LED_COLS = 8;
const LED_COUNT = LED_ROWS * LED_COLS;
// desaturated status lights, boosted past 1.0 (toneMapped: false) so
// they read at distance and catch a whisper of bloom
const LED_COLORS = [
  new THREE.Color("#3fae72").multiplyScalar(1.8),
  new THREE.Color("#4a7fd4").multiplyScalar(1.8),
  new THREE.Color("#d49556").multiplyScalar(1.8),
];
const OFF = new THREE.Color("#0a0f0c");

export function ServerRack() {
  const ledsRef = useRef<THREE.InstancedMesh>(null);
  const spillRef = useRef<THREE.PointLight>(null);
  const blinkState = useRef(new Float32Array(LED_COUNT));
  const glow = useHoverGlow("server-rack");

  const leds = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({ toneMapped: false });
    const mesh = new THREE.InstancedMesh(sharedBox(), mat, LED_COUNT);
    const m = new THREE.Matrix4();
    const s = new THREE.Vector3(0.011, 0.011, 0.008);
    let i = 0;
    for (let r = 0; r < LED_ROWS; r++) {
      for (let c = 0; c < LED_COLS; c++) {
        // one LED cluster per rack unit, right-aligned, PROUD of the
        // faceplates (z 0.168 > plate front 0.162) or they're buried
        m.compose(
          new THREE.Vector3(0.1 + c * 0.026, 0.32 + r * 0.24, 0.168),
          new THREE.Quaternion(),
          s,
        );
        mesh.setMatrixAt(i, m);
        mesh.setColorAt(i, OFF);
        i++;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, []);

  useFrame((state) => {
    const mesh = ledsRef.current;
    if (!mesh || !mesh.instanceColor) return;
    const t = state.clock.elapsedTime;
    let dirty = false;
    for (let i = 0; i < LED_COUNT; i++) {
      // each LED has its own pseudo-random blink cadence
      const cadence = 0.4 + ((i * 37) % 23) * 0.11;
      const phase = Math.sin(t / cadence + i * 1.7);
      const on = phase > (i % 3 === 0 ? -0.2 : 0.55) ? 1 : 0;
      if (on !== blinkState.current[i]) {
        blinkState.current[i] = on;
        mesh.setColorAt(i, on ? LED_COLORS[i % LED_COLORS.length] : OFF);
        dirty = true;
      }
    }
    if (dirty) mesh.instanceColor.needsUpdate = true;

    // hover: the whole status wall breathes a little brighter
    (mesh.material as THREE.MeshBasicMaterial).color.setScalar(1 + glow.current * 0.7);
    if (spillRef.current) spillRef.current.intensity = 0.12 * (1 + glow.current * 2.2);
  });

  return (
    <SceneObject
      def={{ id: "server-rack", name: "GPU Rack", cameraView: "server" }}
      position={[3.3, 0, -2.2]}
      rotation={[0, -0.35, 0]}
    >
      {/* Cabinet */}
      <Bx position={[0, 0.85, 0]} scale={[0.55, 1.7, 0.32]} material={materials.metalDark} />
      {/* Rack units (front plates) — lighter alloy so they read as
          hardware under the accent light instead of vanishing */}
      {Array.from({ length: 6 }, (_, r) => (
        <mesh key={r} position={[0, 0.32 + r * 0.24, 0.152]} scale={[0.48, 0.18, 0.02]}>
          <boxGeometry />
          <meshStandardMaterial color="#4e5056" roughness={0.38} metalness={0.8} />
        </mesh>
      ))}
      {/* Vent slots */}
      {Array.from({ length: 6 }, (_, r) => (
        <Bx
          key={`vent-${r}`}
          position={[-0.09, 0.32 + r * 0.24, 0.163]}
          scale={[0.22, 0.1, 0.004]}
          material={materials.deviceBody}
          castShadow={false}
        />
      ))}
      <primitive object={leds} ref={ledsRef} />
      {/* Faint teal spill — visible as a color temperature shift, not a light */}
      <pointLight ref={spillRef} position={[0.1, 1, 0.35]} intensity={0.12} distance={1.1} decay={2} color="#4a9a76" />
      {/* Feet */}
      <Bx position={[0, 0.02, 0]} scale={[0.5, 0.04, 0.28]} material={materials.deviceBody} />
    </SceneObject>
  );
}
