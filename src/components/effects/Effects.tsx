"use client";

import {
  Bloom,
  EffectComposer,
  N8AO,
  Noise,
  Outline,
  SMAA,
  Vignette,
} from "@react-three/postprocessing";
import { useSelection } from "@/lib/interactive/selection";

/**
 * Post pipeline — graded like film, not like a Three.js demo:
 *
 *   N8AO      grounds geometry into its corners (half-res, cheap)
 *   Bloom     threshold 0.9: only the screen, lamp filament and LED
 *             strips lift. Never the walls.
 *   SMAA      crisp edges without MSAA cost (composer runs multisampling 0)
 *   Noise     film grain — kills banding in the dark gradients and
 *             makes flat CG surfaces read as photographed
 *   Vignette  quiet corner falloff, eye funnels to the desk
 *
 * No depth of field: at wide orbit angles it smeared the whole frame.
 * Crispness beats a depth cue.
 */
export function Effects() {
  // Imperative selection (no <Selection> context — see selection.ts for
  // why the context path infinite-loops in 3.0.4).
  const selection = useSelection();

  return (
    <EffectComposer multisampling={0} autoClear={false}>
      <N8AO aoRadius={0.35} distanceFalloff={0.5} intensity={2.6} quality="performance" halfRes />
      <Bloom mipmapBlur intensity={0.42} luminanceThreshold={0.9} luminanceSmoothing={0.25} />
      {/* hover response — a faint warm rim, read as light, not UI */}
      <Outline
        selection={selection}
        blur
        edgeStrength={1.1}
        visibleEdgeColor={0xffce90}
        hiddenEdgeColor={0x1a140e}
        xRay={false}
      />
      <SMAA />
      <Noise premultiply opacity={0.4} />
      <Vignette eskil={false} offset={0.22} darkness={0.68} />
    </EffectComposer>
  );
}
