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
 * High:   full pipeline (N8AO + Bloom + SMAA + Noise + Vignette)
 * Medium: no AO, lighter bloom/noise
 * Low:    Vignette only — skips EffectComposer overhead entirely
 */
export function Effects() {
  const q = useQuality();

  // Low tier: just a CSS vignette would be cheaper, but even the
  // single-pass Vignette in the composer is lightweight enough.
  // The key saving is skipping N8AO, Bloom and SMAA.
  if (q === "low") {
    return (
      <EffectComposer multisampling={0} autoClear={false}>
        <Vignette eskil={false} offset={0.22} darkness={0.68} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={0} autoClear={false}>
      {q === "high" && (
        <N8AO aoRadius={0.35} distanceFalloff={0.5} intensity={2.6} quality="performance" halfRes />
      )}
      <Bloom
        mipmapBlur
        intensity={q === "high" ? 0.42 : 0.25}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.25}
      />
      {q === "high" && <SMAA />}
      <Noise premultiply opacity={q === "high" ? 0.4 : 0.2} />
      <Vignette eskil={false} offset={0.22} darkness={0.68} />
    </EffectComposer>
  );
}
