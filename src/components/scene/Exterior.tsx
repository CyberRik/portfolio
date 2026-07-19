"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useQualitySettings } from "@/lib/gpuTier";

/**
 * The world outside the diorama: a 360° night-city panorama on an
 * inward-facing cylinder — layered skyline silhouettes with flickering
 * windows, a warm post-sunset glow behind the room's window wall,
 * twinkling stars overhead — plus a dark ground disc so the room reads
 * as an architectural model floating above the city.
 */
const panoramaShader = {
  vertex: /* glsl */ `
    varying vec3 vWorldPos;
    void main() {
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragment: /* glsl */ `
    uniform float uTime;
    varying vec3 vWorldPos;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

    // returns: x = building mask, y = lit-window mask, z = per-building tint
    vec3 cityLayer(float u, float y, float cells, float baseH, float varH, float seed) {
      float col = floor(u * cells);
      float h = baseH + varH * hash(vec2(col, seed));
      float building = step(y, h);
      // window grid with window-like aspect (taller than wide cells)
      float wx = fract(u * cells) * 8.0;
      float wy = y * 24.0;
      vec2 grid = vec2(floor(wx), floor(wy));
      float lit = step(0.72, hash(grid + vec2(col * 13.0, seed)));
      float flick = step(0.03, hash(grid + floor(uTime * vec2(0.2, 0.13)) + seed));
      float inWin = step(0.3, fract(wx)) * step(fract(wx), 0.7)
                  * step(0.25, fract(wy)) * step(fract(wy), 0.8);
      float tint = 0.75 + 0.5 * hash(vec2(col, seed + 31.0));
      return vec3(building, building * lit * flick * inWin, tint);
    }

    void main() {
      float h = vWorldPos.y;
      vec2 hd = normalize(vWorldPos.xz);
      float u = atan(vWorldPos.x, vWorldPos.z) / 6.28318530718 + 0.5;

      // Sky: warm horizon into deep indigo night
      float sky_t = clamp((h + 1.0) / 12.0, 0.0, 1.0);
      vec3 sky = mix(vec3(0.30, 0.16, 0.10), vec3(0.030, 0.038, 0.085), smoothstep(0.0, 0.55, sky_t));
      sky = mix(sky, vec3(0.015, 0.02, 0.05), smoothstep(0.55, 1.0, sky_t));

      // Post-sunset glow behind the room's window wall (-z)
      float sunAmt = smoothstep(0.15, 1.0, dot(hd, normalize(vec2(0.28, -0.96))));
      float lowAmt = smoothstep(4.5, -1.5, h);
      sky += vec3(0.95, 0.42, 0.16) * sunAmt * lowAmt * 0.55;

      #ifdef STARS
      // Stars — static grid on direction, gentle twinkle, upper sky only
      vec2 sGrid = vec2(u * 220.0, (h + 4.0) * 6.0);
      float star = step(0.994, hash(floor(sGrid)));
      float tw = 0.55 + 0.45 * sin(uTime * 1.4 + hash(floor(sGrid) + 7.0) * 6.28);
      float starMask = smoothstep(3.5, 7.0, h);
      // keep stars off building zone & sun glow
      sky += vec3(0.9, 0.95, 1.0) * star * tw * starMask * (1.0 - sunAmt * 0.8) * 0.5;
      #endif

      // City silhouettes: y normalized over building band (-4 .. 3.2)
      float cy = clamp((h + 4.0) / 7.2, 0.0, 1.0);
      vec3 col = sky;

      // tall enough that the skyline reads at eye level through the
      // room's window; per-building tint + vertical ambient gradient
      // keep the silhouettes from reading as flat wallpaper
      float vGrad = 0.75 + 0.5 * cy; // city-glow lightens toward rooflines

      // the farthest layer is the densest (160 columns) and the least
      // visible — it is the first thing to go when the budget is tight
      #if CITY_LAYERS >= 3
      vec3 far = cityLayer(u + uTime * 0.00006, cy, 160.0, 0.55, 0.25, 3.0);
      col = mix(col, vec3(0.10, 0.085, 0.11) * far.z * vGrad, far.x * 0.75);
      col += vec3(0.9, 0.7, 0.42) * far.y * 0.30;
      #endif

      vec3 mid = cityLayer(u + uTime * 0.00012, cy, 96.0, 0.44, 0.25, 7.0);
      col = mix(col, vec3(0.055, 0.055, 0.09) * mid.z * vGrad, mid.x * 0.92);
      col += vec3(1.0, 0.78, 0.48) * mid.y * 0.45;

      vec3 near = cityLayer(u + uTime * 0.0002, cy, 52.0, 0.34, 0.22, 11.0);
      col = mix(col, vec3(0.022, 0.026, 0.05) * near.z * (0.6 + 0.7 * cy), near.x);
      col += vec3(1.0, 0.82, 0.52) * near.y * 0.6;

      // Haze pooling at the horizon line
      col = mix(col, vec3(0.34, 0.19, 0.12), smoothstep(1.2, -2.5, h) * 0.35 * (0.4 + 0.6 * sunAmt));

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

/**
 * Ground far below: dark at the center (under the diorama), warming
 * into a street-glow haze where it meets the building bases, with a
 * scatter of faint street lights. Kills the black void ring.
 */
const groundShader = {
  vertex: /* glsl */ `
    varying vec3 vWorldPos;
    void main() {
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragment: /* glsl */ `
    uniform float uTime;
    varying vec3 vWorldPos;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

    void main() {
      float r = length(vWorldPos.xz);
      float glow = smoothstep(7.0, 24.0, r);
      vec3 col = mix(vec3(0.010, 0.012, 0.026), vec3(0.14, 0.075, 0.04), glow * 0.85);

      // street lights: sparse warm points, denser toward the city
      vec2 cell = floor(vWorldPos.xz * 1.4);
      float on = step(0.9, hash(cell));
      vec2 cuv = fract(vWorldPos.xz * 1.4) - 0.5;
      float pt = smoothstep(0.12, 0.02, length(cuv + (vec2(hash(cell + 3.0), hash(cell + 7.0)) - 0.5) * 0.5));
      col += vec3(1.0, 0.72, 0.4) * on * pt * glow * 0.5;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export function Exterior() {
  const Q = useQualitySettings();

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        defines: {
          CITY_LAYERS: Q.cityLayers,
          ...(Q.cityStars ? { STARS: "" } : {}),
        },
        vertexShader: panoramaShader.vertex,
        fragmentShader: panoramaShader.fragment,
        side: THREE.BackSide,
        toneMapped: false,
        fog: false,
      }),
    [Q.cityLayers, Q.cityStars],
  );
  const groundMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: groundShader.vertex,
        fragmentShader: groundShader.fragment,
        toneMapped: false,
        fog: false,
      }),
    [],
  );

  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <group name="exterior">
      {/* 360° panorama — spans y −4 .. 12.
          renderOrder 1 so it draws AFTER the room: the walls fill the
          depth buffer first and early-Z rejects most of this shader's
          (expensive) fragments before they ever run. */}
      <mesh position={[0, 4, 0]} material={mat} renderOrder={1} frustumCulled={false}>
        <cylinderGeometry args={[26, 26, 16, Q.cityCylinderSegments, 1, true]} />
      </mesh>
      {/* City ground far below the diorama */}
      <mesh
        position={[0, -4.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={groundMat}
        renderOrder={1}
      >
        <circleGeometry args={[26.5, 48]} />
      </mesh>
    </group>
  );
}
