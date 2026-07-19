"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { materials } from "@/lib/materials";
import { Bx, Cyl } from "./primitives";
import { SceneObject } from "@/lib/interactive/SceneObject";
import { useHoverGlow } from "@/lib/interactive/useHoverGlow";
import { DESK } from "./Desk";
import { MonitorScreen } from "./MonitorScreen";

/**
 * Ultrawide monitor — the hero. Procedural editor screen with a
 * blinking cursor, imperceptible panel flicker, and glow that
 * physically spills onto the keyboard and desk (two practicals whose
 * intensity tracks the flicker, so the light feels emitted, not placed).
 */
const screenShader = {
  vertex: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragment: /* glsl */ `
    uniform float uTime;
    uniform float uFlicker;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

    void main() {
      vec3 bg = vec3(0.035, 0.042, 0.066);
      vec3 col = bg;

      // Editor line blocks: rows of "code" with randomized indent + width
      float rows = 22.0;
      float row = floor(vUv.y * rows);
      float inRow = fract(vUv.y * rows);
      float indent = 0.04 + 0.08 * floor(mod(hash(vec2(row, 1.0)) * 4.0, 4.0));
      float len = 0.15 + 0.55 * hash(vec2(row, 7.0));
      float band = step(0.3, inRow) * step(inRow, 0.62);
      float inLine = step(indent, vUv.x) * step(vUv.x, indent + len) * band;
      float hue = hash(vec2(row, 13.0));
      vec3 lineCol = mix(vec3(0.30, 0.45, 0.64), vec3(0.60, 0.48, 0.30), step(0.72, hue));
      lineCol = mix(lineCol, vec3(0.32, 0.55, 0.44), step(0.45, hue) * step(hue, 0.72));
      col = mix(col, lineCol * 0.9, inLine * 0.85);

      // Blinking cursor at the "active" row
      float cursorRow = 8.0;
      float blink = step(0.5, fract(uTime * 0.9));
      float cx = 0.42;
      float cursor = step(cx, vUv.x) * step(vUv.x, cx + 0.006)
                   * step(cursorRow / rows, vUv.y) * step(vUv.y, (cursorRow + 0.6) / rows);
      col += vec3(0.8, 0.95, 1.15) * cursor * blink;

      // Vertical glow falloff + vignette
      col += vec3(0.05, 0.07, 0.10) * (1.0 - vUv.y) * 0.5;
      float vig = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x)
                * smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
      col *= 0.5 + 0.5 * vig;

      // Slow moving sheen (fake reflection of the room)
      float sheen = smoothstep(0.0, 0.5, sin(vUv.x * 3.0 - uTime * 0.12) * 0.5 + 0.5);
      col += vec3(0.02, 0.025, 0.035) * sheen;

      // Panel flicker — ±1.5%, below conscious notice
      col *= uFlicker;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

/**
 * A handwritten sticky note on the bezel's corner — the one personal
 * mark on the machine. Drawn once into a canvas with the Caveat font
 * (waits for document.fonts so the handwriting is real, not fallback).
 */
function StickyNote() {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    let alive = true;
    document.fonts.ready.then(() => {
      if (!alive) return;
      const c = document.createElement("canvas");
      c.width = c.height = 256;
      const g = c.getContext("2d");
      if (!g) return;
      g.fillStyle = "#efd875";
      g.fillRect(0, 0, 256, 256);
      // slight curl shadow along the bottom edge
      const grad = g.createLinearGradient(0, 205, 0, 256);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(110,85,20,0.28)");
      g.fillStyle = grad;
      g.fillRect(0, 205, 256, 51);
      const fam =
        getComputedStyle(document.body).getPropertyValue("--font-caveat").trim() || "cursive";
      g.fillStyle = "#3a3428";
      g.textAlign = "center";
      g.font = `600 66px ${fam}`;
      g.fillText("ship it,", 128, 112);
      g.font = `500 50px ${fam}`;
      g.fillText("then sleep", 128, 172);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      setTex(t);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!tex) return null;
  return (
    <mesh position={[-0.655, -0.2, 0.031]} rotation={[0, 0, 0.055]}>
      <planeGeometry args={[0.085, 0.085]} />
      <meshStandardMaterial map={tex} roughness={0.9} />
    </mesh>
  );
}

/** Two sagging cables from the panel down through the cable tray. */
function Cables() {
  const geoA = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.06, 0.55, -0.02),
      new THREE.Vector3(0.09, 0.32, -0.1),
      new THREE.Vector3(0.05, 0.18, -0.22),
      new THREE.Vector3(0.12, 0.05, -0.3),
    ]);
    return new THREE.TubeGeometry(curve, 24, 0.006, 6);
  }, []);
  const geoB = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.04, 0.55, -0.02),
      new THREE.Vector3(-0.09, 0.36, -0.12),
      new THREE.Vector3(-0.14, 0.16, -0.2),
      new THREE.Vector3(-0.1, 0.04, -0.31),
    ]);
    return new THREE.TubeGeometry(curve, 24, 0.005, 6);
  }, []);
  return (
    <group position={[0, DESK.surfaceY, 0]}>
      <mesh geometry={geoA} material={materials.rubber} castShadow />
      <mesh geometry={geoB} material={materials.rubber} castShadow />
    </group>
  );
}

export function Monitor() {
  const keyLight = useRef<THREE.PointLight>(null);
  const glow = useHoverGlow("monitor");

  const screenMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uFlicker: { value: 1 } },
        vertexShader: screenShader.vertex,
        fragmentShader: screenShader.fragment,
        toneMapped: false,
      }),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // layered high-frequency flicker, ±1.5%; hover lifts the panel's
    // brightness and its spill together — the screen "wakes" to you
    const flicker = 1 + (Math.sin(t * 47.3) * Math.sin(t * 31.7) + Math.sin(t * 9.1)) * 0.0075;
    const lift = 1 + glow.current * 0.22;
    screenMat.uniforms.uTime.value = t;
    screenMat.uniforms.uFlicker.value = flicker * lift;
    if (keyLight.current) keyLight.current.intensity = 1.2 * flicker * (1 + glow.current * 0.5);
  });

  const y = DESK.surfaceY;

  return (
    <SceneObject
      def={{ id: "monitor", name: "Ultrawide Monitor", cameraView: "desk" }}
      position={[0, 0, -2.15]}
    >
      <group position={[0, y + 0.42, 0]}>
        <Bx position={[0, 0, 0]} scale={[1.5, 0.62, 0.045]} material={materials.deviceBody} />
        <mesh position={[0, 0, 0.025]} material={screenMat}>
          <planeGeometry args={[1.44, 0.56]} />
        </mesh>
        {/* RM-OS desktop, pinned to the panel while the portal is open */}
        <MonitorScreen />
        <StickyNote />
        {/* Bias light halo behind the panel */}
        <mesh position={[0, 0, -0.03]}>
          <planeGeometry args={[1.56, 0.68]} />
          <meshBasicMaterial color="#141f30" toneMapped={false} />
        </mesh>
        {/* Screen spill toward the desk — one light, kept high enough
            that it can't ping a hot specular off the clearcoat */}
        <pointLight ref={keyLight} position={[0, 0.05, 0.55]} intensity={1.2} distance={2.6} decay={2} color="#9fc4ff" />
      </group>

      {/* Stand */}
      <Cyl position={[0, y + 0.06, 0]} scale={[0.09, 0.16, 0.09]} material={materials.metalDark} />
      <Bx position={[0, y + 0.01, 0.05]} scale={[0.34, 0.02, 0.2]} material={materials.metalDark} />

      <Cables />
    </SceneObject>
  );
}
