/**
 * Aspect-aware framing.
 *
 * Three.js `PerspectiveCamera.fov` is the VERTICAL field of view, so a
 * camera keeps its vertical coverage and lets horizontal coverage follow
 * the aspect ratio ("Hor+"). On a desktop 16:9 panel that is exactly what
 * the poses in camera.config were composed against. Rotate to a phone's
 * 9:19.5 and the same vfov yields roughly a quarter of the horizontal
 * coverage — the authored wide shot of the room becomes a slice of desk.
 *
 * Every pose in camera.config is affected, so the correction lives here
 * rather than in the numbers: the authored fov is treated as "the vfov
 * that produced the right HORIZONTAL angle at REF_ASPECT", and we solve
 * back for whatever vfov reproduces that horizontal angle at the aspect
 * we actually got.
 *
 * The correction is capped. Past ~70° vertical a perspective camera reads
 * as a fisheye — straight desk edges bow, and the room's proportions stop
 * being believable. Beyond the cap we stop widening and accept the crop;
 * see `framingDeficit` for measuring what the cap costs, since the usual
 * escape hatch (dolly the camera back) is unavailable here — the room is
 * enclosed and the overview pose already sits at ~7.9m against an 8.2m
 * ORBIT_LIMITS.maxDistance.
 */

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

/**
 * The aspect below which the correction engages, and the coverage target
 * it aims to restore: "at least the horizontal angle a 4:3 viewport
 * would have shown".
 *
 * Deliberately NOT the 16:9 the poses were composed against. Using the
 * composition aspect would mean any viewport narrower than 16:9 gets
 * corrected too — including a 1440x900 laptop (1.6), which would silently
 * push the overview from fov 42 to 46 and re-frame a desktop composition
 * that is already signed off. 4:3 sits below every realistic desktop or
 * laptop window and above every tablet-portrait one, so the correction is
 * strictly additive: desktop renders bit-identically to before, and only
 * genuinely narrow viewports are touched.
 */
export const REF_ASPECT = 4 / 3;

/** Vertical fov past which perspective distortion becomes objectionable. */
export const MAX_FOV = 70;

/**
 * Below this aspect a viewport is treated as portrait and a pose's
 * `portrait` variant (if it has one) is used verbatim.
 *
 * 1.0 — literally "taller than wide". Phones in portrait (~0.46) and
 * tablets in portrait (~0.70) are in; every landscape viewport is out.
 */
export const PORTRAIT_ASPECT = 1.0;

export function isPortrait(aspect: number): boolean {
  return Number.isFinite(aspect) && aspect > 0 && aspect < PORTRAIT_ASPECT;
}

/** Horizontal half-angle a given vfov produces at a given aspect. */
function halfHorizontal(fovDeg: number, aspect: number): number {
  return Math.atan(Math.tan((fovDeg * DEG) / 2) * aspect);
}

/**
 * The vfov to actually hand the camera so an authored pose keeps its
 * composed horizontal coverage at `aspect`. Wider screens are left alone
 * — they only ever show MORE than was authored, which is harmless.
 */
export function framedFov(authoredFov: number, aspect: number): number {
  if (!Number.isFinite(aspect) || aspect <= 0) return authoredFov;
  if (aspect >= REF_ASPECT) return authoredFov;

  const wanted = halfHorizontal(authoredFov, REF_ASPECT);
  const vfov = 2 * Math.atan(Math.tan(wanted) / aspect) * RAD;
  return Math.min(vfov, MAX_FOV);
}

/**
 * How much horizontal coverage the MAX_FOV cap is costing, as a ratio of
 * authored width (1 = nothing lost, 0.5 = half the composition cropped).
 *
 * This is the signal that a pose needs a portrait-specific rewrite rather
 * than a wider lens: fov compensation alone cannot save a shot once this
 * drops far below 1.
 */
export function framingDeficit(authoredFov: number, aspect: number): number {
  if (!Number.isFinite(aspect) || aspect <= 0) return 1;
  const got = halfHorizontal(framedFov(authoredFov, aspect), aspect);
  const wanted = halfHorizontal(authoredFov, REF_ASPECT);
  return Math.tan(got) / Math.tan(wanted);
}
