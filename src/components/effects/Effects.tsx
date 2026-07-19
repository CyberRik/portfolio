"use client";

import {
  Bloom,
  EffectComposer,
  N8AO,
  Noise,
  SMAA,
  Vignette,
} from "@react-three/postprocessing";
import { useQuality } from "@/lib/gpuTier";

/**
 * Post pipeline — quality-adaptive.
 *
 * Cost model worth keeping in mind: `postprocessing` merges every
 * screen-space effect into ONE fragment shader, so Noise and Vignette are
 * essentially free riders. The passes that actually cost are the ones
 * needing their own render targets — N8AO, Bloom and SMAA — so those are
 * what the tiers gate.
 *
 * SMAA runs on every tier because MSAA is disabled on the canvas (see
 * SceneCanvas): EffectComposer renders into its own non-multisampled
 * target, which made the context's `antialias` flag pure wasted
 * bandwidth. SMAA is the cheaper replacement, and the tier is fixed at
 * load, so each branch is a stable composer tree.
 */
export function Effects() {
  const q = useQuality();

  if (q === "low") {
    return (
      <EffectComposer multisampling={0} autoClear={false}>
        <SMAA />
        <Vignette eskil={false} offset={0.22} darkness={0.68} />
      </EffectComposer>
    );
  }

  if (q === "medium") {
    return (
      <EffectComposer multisampling={0} autoClear={false}>
        <Bloom mipmapBlur intensity={0.25} luminanceThreshold={0.9} luminanceSmoothing={0.25} />
        <SMAA />
        <Noise premultiply opacity={0.2} />
        <Vignette eskil={false} offset={0.22} darkness={0.68} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={0} autoClear={false}>
      <N8AO aoRadius={0.35} distanceFalloff={0.5} intensity={2.6} quality="performance" halfRes />
      <Bloom mipmapBlur intensity={0.42} luminanceThreshold={0.9} luminanceSmoothing={0.25} />
      <SMAA />
      <Noise premultiply opacity={0.4} />
      <Vignette eskil={false} offset={0.22} darkness={0.68} />
    </EffectComposer>
  );
}
