"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/**
 * Fake volumetric light: two additive gradient quads angled from the
 * window into the room. Breathes gently in sync with nothing in
 * particular — just enough to read as air, not geometry.
 */
const shaftMaterialFactory = () =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uOpacity: { value: 0.04 },
      uColor: { value: new THREE.Color("#ffb677") },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        // fade along the shaft and toward its edges
        float along = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.35, vUv.y);
        float across = smoothstep(0.0, 0.4, vUv.x) * smoothstep(1.0, 0.6, vUv.x);
        gl_FragColor = vec4(uColor, uOpacity * along * across);
      }
    `,
  });

export function SunShaft() {
  const matA = useMemo(shaftMaterialFactory, []);
  const matB = useMemo(shaftMaterialFactory, []);
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const breathe = 0.035 + 0.014 * Math.sin(t * 0.09);
    matA.uniforms.uOpacity.value = breathe;
    matB.uniforms.uOpacity.value = breathe * 0.6;
  });

  return (
    <group ref={group} position={[0, 1.95, -3.05]} rotation={[0.56, 0, 0]}>
      <mesh material={matA} position={[0, -1.1, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.7, 3.4]} />
      </mesh>
      <mesh material={matB} position={[0.3, -1.0, 0.7]} rotation={[Math.PI / 2, 0, 0.15]}>
        <planeGeometry args={[1.6, 3.0]} />
      </mesh>
    </group>
  );
}
