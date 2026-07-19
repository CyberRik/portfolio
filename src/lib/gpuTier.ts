/**
 * Lightweight GPU tier detection — runs once, caches the result.
 *
 * Reads the WebGL renderer string to classify the GPU into one of three
 * quality tiers, then exposes a single `QUALITY` table so every consumer
 * branches on named settings instead of re-deriving `q === "high" ? ... `
 * at each call site.
 *
 * No external dependencies — just reads WEBGL_debug_renderer_info.
 */

export type QualityTier = "high" | "medium" | "low";

let cached: QualityTier | null = null;

/**
 * Unambiguously discrete, unambiguously fast. Checked first because
 * nothing integrated shares these strings.
 *
 * NOTE the deliberate omissions: bare `geforce`, `gtx` and `vega` are NOT
 * here. "Radeon Vega 8 Graphics" is a Ryzen *integrated* GPU and
 * "GeForce MX150" is a weak laptop part — both would be promoted to the
 * high tier by those keywords. They're matched further down instead,
 * after the integrated patterns have had their say.
 */
const DISCRETE_RE =
  /rtx|radeon rx|radeon pro|firepro|quadro|tesla|arc a|apple m[1-9] (pro|max|ultra)/i;

/**
 * Discrete but only after the weak-part patterns below have been ruled
 * out. Ordering is load-bearing — see WEAK_RE.
 */
const DISCRETE_FALLBACK_RE = /geforce|gtx/i;

/**
 * Named parts that are too slow for this scene at any meaningful
 * resolution: pre-Xe Intel graphics, entry-level mobile NVIDIA.
 * Checked BEFORE DISCRETE_FALLBACK_RE so "GeForce MX150" can't be
 * promoted by the bare `geforce` keyword.
 */
const WEAK_RE = /geforce mx|geforce gt \d|\bgt \d{3}\b|gtx \d{3}m|uhd graphics|\bhd graphics/i;

/**
 * Integrated but capable enough for the medium tier: Iris/Iris Xe, base
 * Apple silicon, Ryzen APUs, recent mobile parts.
 */
const INTEGRATED_RE =
  /iris|apple m[1-9]|vega \d|radeon\(?tm\)? graphics|adreno 7|mali-g7[0-9]|xclipse/i;

/**
 * Software rasterizers and headless fallbacks. These report plausible
 * strings but run on the CPU — always the low tier, no matter what else
 * the heuristics say.
 */
const SOFTWARE_RE = /swiftshader|llvmpipe|softpipe|basilisk|virgl|microsoft basic/i;

/** Escape hatch: `?quality=low|medium|high`, or localStorage `quality`. */
function override(): QualityTier | null {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("quality");
    const v = fromUrl ?? window.localStorage.getItem("quality");
    if (v === "low" || v === "medium" || v === "high") return v;
  } catch {
    /* private mode / blocked storage — fall through to detection */
  }
  return null;
}

/**
 * Detect the GPU tier by probing a throwaway WebGL context.
 * Falls back to "medium" if detection fails (safe middle ground).
 */
function detect(): QualityTier {
  if (typeof window === "undefined") return "medium";

  const forced = override();
  if (forced) return forced;

  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return "low";

    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer: string = String(
      ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
    );

    // Release the probe context immediately — browsers cap the number of
    // live WebGL contexts, and the real canvas needs one.
    gl.getExtension("WEBGL_lose_context")?.loseContext();

    if (SOFTWARE_RE.test(renderer)) return "low";

    // Phones and tablets: even a capable mobile GPU is fill-rate bound at
    // native DPR, and this scene is fill-rate heavy.
    const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    if (coarse) return INTEGRATED_RE.test(renderer) ? "medium" : "low";

    // Order matters throughout: each test can only be trusted once the
    // ones above it have ruled their cases out.
    if (DISCRETE_RE.test(renderer)) return "high";
    if (WEAK_RE.test(renderer)) return "low";
    if (INTEGRATED_RE.test(renderer)) return "medium";
    if (DISCRETE_FALLBACK_RE.test(renderer)) return "high";

    // Unknown GPU string — fall back to system proxies.
    // @ts-expect-error — non-standard but widely supported
    const memoryMB = navigator.deviceMemory as number | undefined;
    if (memoryMB && memoryMB <= 4) return "low";

    const cores = navigator.hardwareConcurrency ?? 4;
    if (cores <= 2) return "low";

    return "medium";
  } catch {
    return "medium";
  }
}

/** Returns the detected quality tier. Result is cached after first call. */
export function getQuality(): QualityTier {
  if (cached === null) cached = detect();
  return cached;
}

/** Hook-friendly accessor — same value, never changes after mount. */
export function useQuality(): QualityTier {
  return getQuality();
}

/* ------------------------------- settings -------------------------------- */

export type QualitySettings = {
  /** [min, max] device pixel ratio handed to the Canvas */
  dpr: [number, number];
  /** shadow map edge for the key light / the desk spot */
  sunShadowMap: number;
  spotShadowMap: number;
  /** seconds between shadow-map re-renders (Infinity = bake once) */
  shadowInterval: number;
  /** PCSS soft shadows — the most expensive per-fragment option we have */
  softShadows: false | { size: number; samples: number };
  /** does the desk spot cast at all */
  spotShadow: boolean;
  /**
   * Use a real rectAreaLight for the window fill. Area lights use LTC
   * integration — two texture lookups plus the fit, per fragment, on
   * EVERY standard material in the room. When false a pair of wide,
   * shadowless spots stands in for a fraction of the cost.
   */
  areaFill: boolean;
  contactShadowRes: number;
  /** ambient-occlusion pass */
  ao: boolean;
  /** dust mote count; 0 disables the system */
  dust: number;
  /** city-panorama silhouette layers (3 = far/mid/near) and star field */
  cityLayers: number;
  cityStars: boolean;
  cityCylinderSegments: number;
};

export const QUALITY: Record<QualityTier, QualitySettings> = {
  high: {
    dpr: [1, 1.75],
    sunShadowMap: 2048,
    spotShadowMap: 1024,
    // 15 Hz. The sun drifts at 0.026 rad/s and the only moving caster is
    // the Roomba at 0.3 m/s — a re-bake every 4th frame is invisible and
    // removes 75% of the scene's depth passes.
    shadowInterval: 1 / 15,
    softShadows: { size: 20, samples: 10 },
    spotShadow: true,
    areaFill: true,
    contactShadowRes: 512,
    ao: true,
    dust: 140,
    cityLayers: 3,
    cityStars: true,
    cityCylinderSegments: 96,
  },
  medium: {
    dpr: [1, 1.25],
    sunShadowMap: 1024,
    spotShadowMap: 512,
    shadowInterval: 1 / 8,
    // PCSS off: three's default PCF-soft filtering is a fraction of the
    // cost and, at this shadow-map size, nearly indistinguishable.
    softShadows: false,
    spotShadow: true,
    areaFill: false,
    contactShadowRes: 256,
    ao: false,
    dust: 60,
    cityLayers: 2,
    cityStars: true,
    cityCylinderSegments: 64,
  },
  low: {
    dpr: [0.75, 1],
    sunShadowMap: 512,
    spotShadowMap: 256,
    // bake once at mount and never again
    shadowInterval: Infinity,
    softShadows: false,
    spotShadow: false,
    areaFill: false,
    contactShadowRes: 128,
    ao: false,
    dust: 0,
    cityLayers: 2,
    cityStars: false,
    cityCylinderSegments: 48,
  },
};

/** The settings for the detected tier. */
export function useQualitySettings(): QualitySettings {
  return QUALITY[getQuality()];
}
