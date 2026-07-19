/**
 * Lightweight GPU tier detection — runs once, caches the result.
 *
 * Reads the WebGL renderer string to classify the GPU into one of three
 * quality tiers. Components import `getQuality()` and branch on the result
 * to scale shadows, effects, particles, etc.
 *
 * No external dependencies — just reads WEBGL_debug_renderer_info.
 */

export type QualityTier = "high" | "medium" | "low";

let cached: QualityTier | null = null;

/** Keywords that indicate a discrete / high-performance GPU */
const HIGH_RE =
  /rtx|gtx|radeon rx|radeon pro|firepro|quadro|tesla|arc a|apple m[1-9] (pro|max|ultra)|geforce|vega/i;

/** Keywords that indicate an integrated but capable GPU */
const MEDIUM_RE =
  /iris|apple m[1-9]|uhd [67]\d{2}|adreno 7|mali-g7[0-9]|xclipse/i;

/**
 * Detect the GPU tier by probing a throwaway WebGL context.
 * Falls back to "medium" if detection fails (safe middle ground).
 */
function detect(): QualityTier {
  if (typeof window === "undefined") return "medium";

  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return "low";

    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = ext
      ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);

    // Also consider devicePixelRatio — very high DPR on a weak GPU is a bad sign
    const dpr = window.devicePixelRatio ?? 1;

    if (HIGH_RE.test(renderer)) return "high";
    if (MEDIUM_RE.test(renderer)) return dpr > 2 ? "medium" : "medium";

    // Unknown GPU string + low memory hint → low
    // @ts-expect-error — non-standard but widely supported
    const memoryMB = navigator.deviceMemory;
    if (memoryMB && memoryMB <= 4) return "low";

    // If we can't identify it, check logical cores as a proxy
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
