"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, SoftShadows } from "@react-three/drei";
import { RectAreaLightUniformsLib } from "three-stdlib";
import { useQualitySettings } from "@/lib/gpuTier";

/**
 * Cinematic lighting rig — one story, told in light:
 *
 *   KEY    — low dusk sun raking through the window. Warm, long shadows,
 *            slowly drifting. This is the A24 shot.
 *   FILL   — a cool rect area light in the window plane: soft blue-hour
 *            gradient washing the room, complementary to the sun.
 *   HERO   — the monitor's own glow (lives in Monitor.tsx) pulls the eye;
 *            the ceiling practical is now a dim, tight pool on the desk
 *            so the desk zone is the brightest real estate in frame.
 *   ACCENTS— floor lamp warm pool (corner interest), server LED spill,
 *            under-shelf strips. Everything else falls into shadow —
 *            contrast is the composition.
 *
 * No ambient light. Darkness is allowed to exist.
 *
 * PERF: the sun moves every frame, which would make three re-render both
 * shadow maps every frame — two full scene depth passes over ~45 casters.
 * Both lights run with `shadow.autoUpdate = false` and are re-baked on a
 * timer instead (see the shadow throttle in useFrame). The sun drifts at
 * 0.026 rad/s, so nothing about this is perceptible.
 */
let rectAreaInit = false;

export function Lighting() {
  const Q = useQualitySettings();
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const spotRef = useRef<THREE.SpotLight>(null);
  const sinceBake = useRef(0);

  // Light targets must live in the scene graph for their matrices to update
  const sunTarget = useMemo(() => {
    const o = new THREE.Object3D();
    // beam clears the sill and pools on the bare oak in the foreground,
    // past the rug's front edge — visible warmth, not swallowed by fabric
    o.position.set(0.2, 0, 1.1);
    return o;
  }, []);
  const deskTarget = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0, 0.75, -1.9);
    return o;
  }, []);
  const whiteboardTarget = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(3.92, 1.55, 0.55);
    return o;
  }, []);
  const rackTarget = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(3.3, 1.0, -2.2);
    return o;
  }, []);

  // LTC lookup textures are only needed if a rectAreaLight actually
  // renders — on the substitute tiers we skip the upload entirely.
  useMemo(() => {
    if (Q.areaFill && !rectAreaInit) {
      RectAreaLightUniformsLib.init();
      rectAreaInit = true;
    }
  }, [Q.areaFill]);

  // Aim point for the substitute window fill. Deliberately well forward
  // of the room centre: an area light washes broadly, so the stand-in
  // cones have to be pointed deep into the room or the cool cast dies
  // before it reaches the foreground floor and the shot goes warm.
  const fillTarget = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0, 0.8, 1.2);
    return o;
  }, []);

  // Take both shadow maps off the per-frame path. They re-bake on demand
  // below; the first bake happens on the frame right after mount.
  useEffect(() => {
    for (const l of [sunRef.current, spotRef.current]) {
      if (!l) continue;
      l.shadow.autoUpdate = false;
      l.shadow.needsUpdate = true;
    }
  }, []);

  useFrame((state, delta) => {
    const sun = sunRef.current;
    if (!sun) return;
    const t = state.clock.elapsedTime;
    // Sun drifts across the window over a ~4 min arc — noticeable only
    // if you stay, which is the point.
    const sway = Math.sin(t * 0.026);
    // steep enough that the beam actually lands mid-room after
    // clearing the window sill — the raking pool IS the shot
    sun.position.set(2.0 + sway * 0.7, 4.2 + sway * 0.35, -6.5);
    const warmth = 0.5 + 0.5 * Math.sin(t * 0.019);
    sun.color.setHSL(0.062 + warmth * 0.014, 0.82, 0.58);
    sun.intensity = 2.9 + warmth * 0.4;

    // --- shadow throttle: the whole point of the rig above ---
    sinceBake.current += delta;
    if (sinceBake.current >= Q.shadowInterval) {
      sinceBake.current = 0;
      sun.shadow.needsUpdate = true;
      if (spotRef.current) spotRef.current.shadow.needsUpdate = true;
    }
  });

  return (
    <>
      {Q.softShadows && (
        <SoftShadows size={Q.softShadows.size} samples={Q.softShadows.samples} focus={0.5} />
      )}

      <primitive object={sunTarget} />
      <primitive object={deskTarget} />
      <primitive object={whiteboardTarget} />
      <primitive object={rackTarget} />

      {/* KEY — dusk sun through the window, long and low */}
      <directionalLight
        target={sunTarget}
        ref={sunRef}
        position={[2.0, 4.2, -6.5]}
        intensity={3.1}
        color="#ff9a50"
        castShadow
        shadow-mapSize={[Q.sunShadowMap, Q.sunShadowMap]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={4}
        shadow-camera-bottom={-1}
        shadow-camera-near={1}
        shadow-camera-far={16}
      />

      {/* FILL — cool blue-hour wash from the window plane.
          High tier gets the real area light. Everything else gets a pair
          of wide shadowless spots straddling the window: an extended
          source is what the rect light was really buying, and two cones
          with full penumbra approximate that gradient closely enough at
          a small fraction of the per-fragment cost. */}
      {Q.areaFill ? (
        <rectAreaLight
          position={[0, 1.9, -3.15]}
          rotation={[0, Math.PI, 0]}
          width={2.8}
          height={1.5}
          intensity={3.4}
          color="#7593c6"
        />
      ) : (
        <>
          <primitive object={fillTarget} />
          <spotLight
            target={fillTarget}
            position={[-0.9, 1.9, -3.0]}
            angle={1.1}
            penumbra={1}
            intensity={4.4}
            distance={11}
            decay={2}
            color="#7593c6"
          />
          <spotLight
            target={fillTarget}
            position={[0.9, 1.9, -3.0]}
            angle={1.1}
            penumbra={1}
            intensity={4.4}
            distance={11}
            decay={2}
            color="#7593c6"
          />
        </>
      )}

      {/* Faint cool skylight so ceiling/far corners don't clip to black */}
      <hemisphereLight args={["#4a5b7a", "#2b2016", 0.32]} />

      {/* HERO SUPPORT — warm pool from the pendant lamp over the desk */}
      <spotLight
        ref={spotRef}
        target={deskTarget}
        position={[0, 2.6, -1.5]}
        angle={0.52}
        penumbra={1}
        intensity={2.5}
        distance={6}
        decay={2}
        color="#ffe0ba"
        castShadow={Q.spotShadow}
        shadow-mapSize={[Q.spotShadowMap, Q.spotShadowMap]}
        shadow-bias={-0.0004}
        // the pool only ever needs to cover the desk zone — a tight
        // frustum is both sharper and cheaper to fill
        shadow-camera-near={0.5}
        shadow-camera-far={5}
      />

      {/* Picture light washing the whiteboard — gives the right wall a
          story instead of a black hole */}
      <spotLight
        target={whiteboardTarget}
        position={[3.0, 2.9, 0.6]}
        angle={0.62}
        penumbra={1}
        intensity={2.6}
        distance={4.5}
        decay={2}
        color="#ffe8d0"
      />

      {/* Cool downlight on the server rack — machine-room accent so the
          rack reads as hardware, not a black monolith */}
      <spotLight
        target={rackTarget}
        position={[2.3, 2.6, -0.9]}
        angle={0.55}
        penumbra={1}
        intensity={4}
        distance={4.5}
        decay={2}
        color="#cdd9ea"
      />

      {/* KICKER — whisper of cool light from front-left: lifts chair and
          desk edges out of black with a soft rim, no shadows */}
      <spotLight
        position={[-3.2, 2.4, 2.6]}
        angle={0.8}
        penumbra={1}
        intensity={1.5}
        distance={9}
        decay={2}
        color="#8ea6cc"
      />

      {/* Environment — teal-orange studio, drives all specular interest */}
      <Environment resolution={256} frames={1}>
        {/* warm horizon card behind the window */}
        <Lightformer intensity={2.2} color="#ffb677" position={[0, 1.6, -6]} scale={[5, 1.6, 1]} form="rect" />
        {/* cool sky dome */}
        <Lightformer intensity={0.5} color="#7f9dd4" position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 8, 1]} form="circle" />
        {/* soft warm bounce card, camera-left */}
        <Lightformer intensity={0.45} color="#ffdcb8" position={[-5, 1.6, 1]} rotation={[0, Math.PI / 2, 0]} scale={[3, 1.6, 1]} form="rect" />
        {/* dim neutral card camera-right so metals have a second highlight */}
        <Lightformer intensity={0.3} color="#cfd8e8" position={[5, 2, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[2.5, 1.5, 1]} form="rect" />
      </Environment>

      {/* Grounding shadow under the furniture mass */}
      <ContactShadows
        position={[0, 0.013, -1.2]}
        opacity={0.62}
        scale={9}
        blur={3}
        far={2.2}
        resolution={Q.contactShadowRes}
        color="#0e0a06"
        frames={1}
      />
    </>
  );
}
