"use client";

/**
 * The product's shared design language — one motion vocabulary for
 * every world. Sections keep their own materials (marker, phosphor,
 * paper, night sky) but they all move with the same hand:
 *
 *  - EASE.out   — arrivals: fast start, long settle (the signature curve)
 *  - EASE.inOut — world fades and camera-scale travel
 *  - EASE.in    — exits: things leave quicker than they arrive
 *
 * Durations sit on one scale. When a new timing is needed, pick the
 * nearest step instead of inventing a number.
 */
type Bezier = [number, number, number, number];

export const EASE: { out: Bezier; inOut: Bezier; in: Bezier } = {
  out: [0.16, 1, 0.3, 1],
  inOut: [0.65, 0, 0.35, 1],
  in: [0.5, 0, 0.75, 1],
};

export const DUR = {
  /** taps, toggles, window chrome */
  tap: 0.22,
  /** content blocks appearing */
  ui: 0.4,
  /** larger layout moves */
  move: 0.7,
  /** a whole world fading in */
  world: 1.2,
  /** every world leaves at the same speed */
  exit: 0.45,
} as const;

/** shared portal-world fade — every world enters and leaves the same way */
export const WORLD_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: DUR.world, ease: EASE.inOut },
  exit: { opacity: 0, transition: { duration: DUR.exit, ease: EASE.in } },
};

/** staggered content reveal — rise + fade with the signature settle */
export const rise = (delay = 0, dist = 8) => ({
  initial: { opacity: 0, y: dist },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: DUR.ui, ease: EASE.out },
});
