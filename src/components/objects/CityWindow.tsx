"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { materials } from "@/lib/materials";
import { Bx } from "./primitives";
import { SceneObject } from "@/lib/interactive/SceneObject";
import { ROOM } from "@/components/scene/Room";

/**
 * Window on the back wall + procedural city outside.
 * The skyline is one full-screen quad shader: layered building silhouettes,
 * flickering window lights, drifting clouds and a dusk gradient sky.
 * Sits 3m behind the glass for parallax when orbiting.
 */
const cityShader = {
  vertex: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragment: /* glsl */ `
    uniform float uTime;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
                 mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
    }

    // Returns building mask + window lights for one silhouette layer
    vec2 cityLayer(vec2 uv, float cells, float baseH, float varH, float seed) {
      float col = floor(uv.x * cells);
      float h = baseH + varH * hash(vec2(col, seed));
      float building = step(uv.y, h);
      // windows: small grid inside the building, sparse + flickering
      vec2 wuv = vec2(fract(uv.x * cells), uv.y);
      vec2 grid = vec2(floor(wuv.x * 6.0), floor(wuv.y * 40.0));
      float lit = step(0.72, hash(grid + vec2(col * 13.0, seed)));
      float flick = step(0.03, hash(grid + floor(uTime * vec2(0.2, 0.13)) + seed));
      float inWin = step(0.25, fract(wuv.x * 6.0)) * step(fract(wuv.x * 6.0), 0.75)
                  * step(0.3, fract(wuv.y * 40.0)) * step(fract(wuv.y * 40.0), 0.7);
      return vec2(building, building * lit * flick * inWin);
    }

    void main() {
      // Dusk sky gradient — burnt amber horizon into deep indigo,
      // amber carried higher so the window never reads lavender
      vec3 sky = mix(vec3(0.88, 0.46, 0.20), vec3(0.12, 0.11, 0.19), smoothstep(0.06, 0.62, vUv.y));
      sky = mix(sky, vec3(0.04, 0.05, 0.11), smoothstep(0.62, 1.0, vUv.y));

      // Post-sunset: no disc, just a broad warm glow pooling where
      // the sun went down — pure Villeneuve
      vec2 sunPos = vec2(0.63, 0.38);
      float sun = length((vUv - sunPos) * vec2(1.0, 1.5));
      sky += vec3(0.95, 0.5, 0.24) * smoothstep(0.5, 0.0, sun) * 0.3;

      // Drifting clouds — thin cirrus bands, barely there
      float cl = noise(vec2(vUv.x * 3.0 + uTime * 0.006, vUv.y * 6.0));
      cl = smoothstep(0.58, 0.88, cl) * smoothstep(0.9, 0.45, vUv.y) * step(0.35, vUv.y);
      sky = mix(sky, vec3(0.22, 0.17, 0.24), cl * 0.38);

      // Three parallax silhouette layers, far to near — each layer
      // sinks deeper into the haze the further away it is
      vec3 col = sky;
      vec2 far = cityLayer(vec2(vUv.x + uTime * 0.0005, vUv.y), 26.0, 0.42, 0.2, 3.0);
      col = mix(col, vec3(0.20, 0.16, 0.20), far.x * 0.7);
      col += vec3(0.9, 0.7, 0.42) * far.y * 0.28;

      vec2 mid = cityLayer(vec2(vUv.x + uTime * 0.001, vUv.y), 17.0, 0.33, 0.24, 7.0);
      col = mix(col, vec3(0.10, 0.095, 0.15), mid.x * 0.9);
      col += vec3(1.0, 0.78, 0.48) * mid.y * 0.42;

      vec2 near = cityLayer(vec2(vUv.x + uTime * 0.0016, vUv.y), 9.0, 0.24, 0.2, 11.0);
      col = mix(col, vec3(0.04, 0.045, 0.085), near.x);
      col += vec3(1.0, 0.82, 0.52) * near.y * 0.6;

      // Atmospheric haze pooling at the horizon
      col = mix(col, vec3(0.5, 0.3, 0.2), smoothstep(0.32, 0.0, vUv.y) * 0.3);

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export function CityWindow() {
  const { window: win } = ROOM;
  const halfD = ROOM.depth / 2;

  const cityMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: cityShader.vertex,
        fragmentShader: cityShader.fragment,
        toneMapped: false,
      }),
    [],
  );

  useFrame((state) => {
    cityMat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <SceneObject def={{ id: "window", name: "Window", cameraView: "window" }}>
      {/* Window frame */}
      <group position={[0, win.centerY, -halfD]}>
        <Bx position={[0, win.height / 2 + 0.04, 0]} scale={[win.width + 0.16, 0.08, 0.18]} material={materials.metalDark} />
        <Bx position={[0, -win.height / 2 - 0.04, 0]} scale={[win.width + 0.16, 0.08, 0.18]} material={materials.metalDark} />
        <Bx position={[-win.width / 2 - 0.04, 0, 0]} scale={[0.08, win.height + 0.16, 0.18]} material={materials.metalDark} />
        <Bx position={[win.width / 2 + 0.04, 0, 0]} scale={[0.08, win.height + 0.16, 0.18]} material={materials.metalDark} />
        {/* Center mullion */}
        <Bx position={[0, 0, 0]} scale={[0.04, win.height, 0.06]} material={materials.metalDark} />
        {/* Sill */}
        <Bx position={[0, -win.height / 2 - 0.1, 0.12]} scale={[win.width + 0.3, 0.04, 0.3]} material={materials.woodDark} />

        {/* Glass */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[win.width, win.height]} />
          <primitive object={materials.glass} attach="material" />
        </mesh>
      </group>

      {/* City backdrop — 3m behind the wall for parallax */}
      <mesh position={[0, 1.6, -halfD - 3]}>
        <planeGeometry args={[14, 6]} />
        <primitive object={cityMat} attach="material" />
      </mesh>
    </SceneObject>
  );
}
