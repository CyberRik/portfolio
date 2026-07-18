"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { materials } from "@/lib/materials";
import { SceneObject } from "@/lib/interactive/SceneObject";
import { useHoverGlow } from "@/lib/interactive/useHoverGlow";
import { DESK } from "./Desk";

/**
 * Steam as a perlin-displaced ribbon (technique à la Bruno Simon's
 * room): a slim plane whose top edge sways with noise, alpha shaped by
 * scrolling perlin — reads as a continuous wisp, not particle dots.
 * Two crossed planes so it works from every orbit angle.
 */
const steamShader = {
  vertex: /* glsl */ `
    uniform float uTime;
    varying vec2 vUv;

    vec2 hash2(vec2 p) {
      return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453) * 2.0 - 1.0;
    }
    float perlin(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(dot(hash2(i), f), dot(hash2(i + vec2(1, 0)), f - vec2(1, 0)), u.x),
        mix(dot(hash2(i + vec2(0, 1)), f - vec2(0, 1)), dot(hash2(i + vec2(1, 1)), f - vec2(1, 1)), u.x),
        u.y);
    }

    void main() {
      vUv = uv;
      vec3 p = position;
      // sway grows quadratically toward the top of the ribbon
      float sway = pow(uv.y, 2.0) * 0.05;
      p.x += perlin(vec2(uv.y * 4.0 - uTime * 0.35, uTime * 0.1)) * sway;
      p.z += perlin(vec2(uv.y * 3.0 + uTime * 0.28, 7.0)) * sway * 0.7;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `,
  fragment: /* glsl */ `
    uniform float uTime;
    varying vec2 vUv;

    vec2 hash2(vec2 p) {
      return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453) * 2.0 - 1.0;
    }
    float perlin(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(dot(hash2(i), f), dot(hash2(i + vec2(1, 0)), f - vec2(1, 0)), u.x),
        mix(dot(hash2(i + vec2(0, 1)), f - vec2(0, 1)), dot(hash2(i + vec2(1, 1)), f - vec2(1, 1)), u.x),
        u.y);
    }

    void main() {
      vec2 uv = vUv * vec2(3.0, 4.0);
      uv.y -= uTime * 0.32;

      // fade at the ribbon's side edges, base and top
      float border = min(vUv.x * 4.0, (1.0 - vUv.x) * 4.0);
      border = min(border, 1.0) * smoothstep(0.0, 0.15, vUv.y) * (1.0 - vUv.y);

      float a = perlin(uv) * 0.5 + 0.3;
      a *= border * 0.5;

      gl_FragColor = vec4(vec3(0.85, 0.83, 0.8), max(a, 0.0));
    }
  `,
};

function Steam() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: steamShader.vertex,
        fragmentShader: steamShader.fragment,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [],
  );

  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <group position={[0, 0.28, 0]}>
      <mesh material={mat}>
        <planeGeometry args={[0.07, 0.36, 1, 12]} />
      </mesh>
      <mesh material={mat} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.07, 0.36, 1, 12]} />
      </mesh>
    </group>
  );
}

export function CoffeeMug() {
  const y = DESK.surfaceY;
  const glow = useHoverGlow("coffee-mug");
  const catchLight = useRef<THREE.PointLight>(null);

  useFrame(() => {
    // hover: the mug catches a little warm light, as if a lamp turned
    // its way — glaze specular lifts, nothing moves
    if (catchLight.current) catchLight.current.intensity = glow.current * 0.55;
  });

  return (
    <SceneObject
      def={{ id: "coffee-mug", name: "Coffee", cameraView: "desk" }}
      position={[0.75, y, -1.95]}
    >
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.042, 0.036, 0.1, 20]} />
        <meshStandardMaterial color="#c9553d" roughness={0.3} />
      </mesh>
      {/* Coffee surface */}
      <mesh position={[0, 0.096, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.036, 20]} />
        <meshStandardMaterial color="#2b1a10" roughness={0.15} />
      </mesh>
      {/* Handle */}
      <mesh position={[0.05, 0.05, 0]} castShadow>
        <torusGeometry args={[0.024, 0.007, 10, 18]} />
        <primitive object={materials.mug} attach="material" />
      </mesh>
      <Steam />
      <pointLight ref={catchLight} position={[0.18, 0.28, 0.2]} intensity={0} distance={0.8} decay={2} color="#ffca8a" />
    </SceneObject>
  );
}
