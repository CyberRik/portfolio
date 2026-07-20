"use client";

import {
  Bloom,
  EffectComposer,
  N8AO,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { SMAAEffect, SMAAPreset } from "postprocessing";
import { useMemo } from "react";
import { useQuality } from "@/lib/gpuTier";

/**
 * How different two neighbouring pixels must be before SMAA treats them
 * as an edge worth blending.
 *
 * The stock 0.05 is tuned for bright, high-contrast content and it is the
 * reason most of this room stayed jagged even at the ULTRA preset. This
 * is a night scene: the window mullion against the dusk sky, the bookshelf
 * against the accent wall, the wall corners — those are all dark-on-dark,
 * and they land around 0.03-0.04 of contrast. Every one of them fell under
 * the threshold, got discarded before the blending pass ever saw it, and
 * kept a clean untouched staircase. Bright edges like the ceiling cove
 * cleared 0.05 easily, which is exactly why those looked fixed and these
 * did not.
 *
 * Dropping the threshold lets the dark edges into the same pass that was
 * already running. It is not free — more pixels pass the test, so more of
 * them run the weight calculation — but it is one pass on an existing
 * render target, with no new allocation and no resolve, which is far
 * cheaper than the alternatives (MSAA or a higher DPR) for the same
 * result. Going much below this starts blending texture detail (wood
 * grain, the rug weave) as if it were geometry, which reads as smearing.
 */
const EDGE_THRESHOLD = 0.02;

/**
 * SMAA with the threshold applied.
 *
 * Built by hand rather than as `<SMAA preset={...} />` because the
 * threshold lives on the edge-detection material and is not a constructor
 * option, so it can only be set on the instance. Reaching for that
 * instance with a `ref` on the JSX wrapper is what NOT to do here: the ref
 * ends up in the element's props, and EffectComposer serializes child
 * props to build its memo key, so the ref's parent/children cycle throws
 * "Converting circular structure to JSON" and takes down the whole canvas.
 * Owning the instance sidesteps the wrapper entirely.
 */
function SceneSMAA() {
  const effect = useMemo(() => {
    const e = new SMAAEffect({ preset: SMAAPreset.ULTRA });
    e.edgeDetectionMaterial.setEdgeDetectionThreshold(EDGE_THRESHOLD);
    return e;
  }, []);
  return <primitive object={effect} dispose={null} />;
}

/**
 * Post pipeline — quality-adaptive.
 *
 * Cost model worth keeping in mind: `postprocessing` merges every
 * screen-space effect into ONE fragment shader, so Noise and Vignette are
 * essentially free riders. The passes that actually cost are the ones
 * needing their own render targets — N8AO, Bloom and SMAA — so those are
 * what the tiers gate.
 *
 * SMAA is pinned to the ULTRA preset on every tier. The presets differ
 * almost entirely in `maxSearchSteps` — how far along an edge the shader
 * will walk to find where the coverage crosses over — and that is the one
 * knob that matters here: the room's problem edges (ceiling cove, window
 * rails, shelf lips, baseboards) are all long and shallow, so the crossing
 * is far away in screen space. Below ULTRA the search gives up before
 * reaching it, SMAA blends only the stub it found, and the rest of the run
 * keeps its stair-steps — which is exactly the artifact that looked like
 * "SMAA isn't working". More steps is more taps in a pass that already
 * exists: no new render target and no extra bandwidth, which is why this
 * is worth spending before MSAA or DPR.
 *
 * SMAA runs on every tier because the CANVAS `antialias` flag stays off
 * (see SceneCanvas): the composer renders into its own target, so a
 * multisampled default framebuffer would be allocated and never used.
 * That is still true — but it is a statement about the canvas, not about
 * MSAA in general, and for a while it was read as "MSAA is off, period".
 *
 * `multisampling` here is the other thing entirely: it makes the
 * composer's own scene target multisampled, which is the supported way to
 * get real MSAA in this pipeline. It is worth having because SMAA has a
 * hard ceiling that no amount of tuning gets past — it reconstructs edges
 * from the finished color buffer, so where a pixel's true coverage was
 * never sampled it can only guess. Every remaining staircase in the room
 * (the window mullion is the clearest) is that limit, not a setting.
 *
 * Unlike the rest of the fixes in this file, this one is NOT free: the
 * target costs 4x the samples and has to be resolved every frame. It is
 * gated by tier accordingly, and it is still much cheaper than the naive
 * alternative of raising DPR, which scales every pass in the chain
 * quadratically instead of just this one.
 */
export function Effects() {
  const q = useQuality();

  if (q === "low") {
    return (
      <EffectComposer multisampling={0} autoClear={false}>
        <SceneSMAA />
        <Vignette eskil={false} offset={0.22} darkness={0.68} />
      </EffectComposer>
    );
  }

  if (q === "medium") {
    return (
      <EffectComposer multisampling={2} autoClear={false}>
        <Bloom mipmapBlur intensity={0.25} luminanceThreshold={0.9} luminanceSmoothing={0.25} />
        <SceneSMAA />
        <Noise premultiply opacity={0.2} />
        <Vignette eskil={false} offset={0.22} darkness={0.68} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={4} autoClear={false}>
      <N8AO aoRadius={0.35} distanceFalloff={0.5} intensity={2.6} quality="performance" halfRes />
      <Bloom mipmapBlur intensity={0.42} luminanceThreshold={0.9} luminanceSmoothing={0.25} />
      <SceneSMAA />
      <Noise premultiply opacity={0.4} />
      <Vignette eskil={false} offset={0.22} darkness={0.68} />
    </EffectComposer>
  );
}
