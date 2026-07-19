"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SceneObject } from "@/lib/interactive/SceneObject";
import { useQuality } from "@/lib/gpuTier";

/**
 * Autonomous vacuum bot — the room's one free-roaming inhabitant.
 * It patrols a hand-authored waypoint graph across the open floor
 * (every edge is verified clear of the chair, coffee table, plants
 * and desk legs — two waypoints sweep UNDER the desk), pausing at
 * each stop like it's thinking, then gliding on. Slow, quiet,
 * deliberate: a system at work, not a toy.
 */

/** [x, z] floor waypoints */
const WAYPOINTS: readonly [number, number][] = [
  [2.5, 0.9], // A — entry side
  [2.4, -0.3], // B — near server rack, clear of it
  [0.2, 1.5], // C — front centre
  [-1.4, 0.9], // D — rug, clear of coffee table
  [-1.3, -0.2], // E — rug, left
  [0.6, 0.35], // F — room centre
  [0.0, -1.75], // G — under the desk (only via E/F)
  [-0.4, -1.7], // H — under the desk, left (only via E/F)
];

/** which waypoints are reachable in a straight, obstacle-free line */
const NEXT: readonly (readonly number[])[] = [
  [1, 2, 5], // A → B C F
  [0, 4, 5], // B → A E F
  [0, 3, 5], // C → A D F
  [2, 4, 5], // D → C E F
  [1, 3, 5, 6, 7], // E → B D F G H
  [0, 1, 2, 3, 4, 6, 7], // F → most places
  [4, 5], // G → back out via E F
  [4, 5], // H → back out via E F
];

const SPEED = 0.3; // m/s cruise
const BODY_R = 0.155;
const BODY_H = 0.048;

export function Roomba() {
  const body = useRef<THREE.Group>(null);
  const led = useRef<THREE.MeshStandardMaterial>(null);

  // Spawns UNDER the desk: the one-frame ContactShadows bake happens at
  // mount, so the bot's baked blob must land somewhere already dark —
  // and it gets to make an entrance, driving out on its first leg.
  const state = useRef({
    pos: new THREE.Vector2(WAYPOINTS[6][0], WAYPOINTS[6][1]),
    wp: 6,
    targetWp: 5,
    heading: 0,
    driving: true,
    pauseUntil: 0,
  });

  const ringGeo = useMemo(() => new THREE.TorusGeometry(0.055, 0.004, 8, 40), []);
  const isLow = useQuality() === "low";

  /**
   * Held invisible for the first few rendered frames.
   *
   * ContactShadows bakes the floor ONCE (`frames={1}`) and then paints
   * that texture forever. Anything in the scene at bake time is burned
   * in permanently — so the one object that drives around left its
   * shadow behind as a stain on the open floor while the bot itself was
   * somewhere else entirely.
   *
   * Invisible objects are skipped by the renderer, including the depth
   * pass ContactShadows uses, so missing that bake is the whole fix. The
   * count is in FRAMES, not milliseconds, deliberately: it shares the
   * frame loop with the bake, so it can't race it on a slow machine the
   * way a wall-clock timer would. The bot still casts a normal, moving
   * shadow from the lights — that one was never the problem.
   */
  const [visible, setVisible] = useState(false);
  const framesSeen = useRef(0);

  useFrame(({ clock }, delta) => {
    if (!visible) {
      framesSeen.current += 1;
      // bake lands on frame 1; a small margin costs nothing and this is
      // all behind the loading screen anyway
      if (framesSeen.current > 3) setVisible(true);
      return;
    }
    if (isLow) return; // skip animation on weak GPUs
    const s = state.current;
    const t = clock.elapsedTime;
    const g = body.current;
    if (!g) return;

    if (s.driving) {
      const [tx, tz] = WAYPOINTS[s.targetWp];
      const dx = tx - s.pos.x;
      const dz = tz - s.pos.y;
      const dist = Math.hypot(dx, dz);

      if (dist < 0.06) {
        // arrived — think for a moment before the next leg
        s.wp = s.targetWp;
        s.driving = false;
        s.pauseUntil = t + 1.2 + Math.random() * 2.4;
      } else {
        // smooth steering: damp the heading toward the goal (shortest arc)
        const want = Math.atan2(dx, dz);
        let diff = want - s.heading;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        s.heading += diff * Math.min(1, 4.5 * delta);

        // ease in on departure, ease out on approach
        const speed = Math.min(SPEED, 0.12 + dist * 0.8);
        // only advance while roughly facing the goal — it turns in place first
        const facing = Math.max(0, Math.cos(diff));
        s.pos.x += Math.sin(s.heading) * speed * facing * delta;
        s.pos.y += Math.cos(s.heading) * speed * facing * delta;
      }
    } else if (t > s.pauseUntil) {
      const options = NEXT[s.wp];
      s.targetWp = options[Math.floor(Math.random() * options.length)];
      s.driving = true;
    }

    g.position.set(s.pos.x, 0, s.pos.y);
    g.rotation.y = s.heading;

    // status LED: calm breathing while paused, steady while driving
    if (led.current) {
      led.current.emissiveIntensity = s.driving
        ? 1.6
        : 1.0 + Math.sin(t * 2.4) * 0.5;
    }
  });

  return (
    <SceneObject def={{ id: "roomba", name: "Vacuum Unit 01" }} visible={visible}>
      <group ref={body}>
        {/* main disc */}
        <mesh position={[0, BODY_H / 2 + 0.006, 0]} castShadow>
          <cylinderGeometry args={[BODY_R, BODY_R * 0.985, BODY_H, 36]} />
          <meshStandardMaterial color="#1b1c1f" roughness={0.55} metalness={0.35} />
        </mesh>
        {/* top plate */}
        <mesh position={[0, BODY_H + 0.009, 0]}>
          <cylinderGeometry args={[BODY_R * 0.82, BODY_R * 0.82, 0.006, 36]} />
          <meshStandardMaterial color="#232529" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* front bumper — gives it a face, shows travel direction */}
        <mesh position={[0, BODY_H / 2 + 0.006, BODY_R * 0.93]} castShadow>
          <boxGeometry args={[0.14, BODY_H * 0.8, 0.02]} />
          <meshStandardMaterial color="#141518" roughness={0.7} metalness={0.2} />
        </mesh>
        {/* status LED ring */}
        <mesh position={[0, BODY_H + 0.013, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={ringGeo}>
          <meshStandardMaterial
            ref={led}
            color="#0c2a26"
            emissive="#6fd8c4"
            emissiveIntensity={1.6}
            roughness={0.4}
          />
        </mesh>
      </group>
    </SceneObject>
  );
}
