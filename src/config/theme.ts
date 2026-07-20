/**
 * Global visual language of the workspace.
 * Warm, expensive, minimal — Apple / Linear / Anthropic, not gaming.
 *
 * STYLIZED, not photoreal. The distinction is load-bearing and it is the
 * reason these values look "too light" next to a reference photo.
 *
 * A photoreal room earns its darkness: real bounce light falls off fast,
 * so deep shadow reads as correct. But it also invites the viewer to
 * compare the render against reality, and every flat book spine, card
 * plant and quad brush stroke in here loses that comparison. Worse, most
 * of the frame was landing near black — fine on a colour-managed monitor
 * in a dim room, unreadable on a work laptop at half brightness, which is
 * where a portfolio actually gets opened.
 *
 * So the base values carry more light and more chroma than physical
 * plausibility wants. Nothing here should sit below roughly #2a2620 —
 * that is the floor at which a surface still reads as a coloured material
 * rather than a hole in the image.
 */
export const palette = {
  // Architecture — lifted out of near-black so walls read as surfaces
  wall: "#403830",
  wallAccent: "#4a4136",
  floor: "#5a4838",
  ceiling: "#38332c",
  rug: "#2f2a26",

  // Furniture
  deskTop: "#9a7754",
  deskLeg: "#2a2724",
  woodDark: "#5c4531",
  woodLight: "#ad8a63",
  // was #1a1a1c — pure enough black that the desk legs, monitor bezel and
  // window frame all disappeared into the wall behind them
  metalDark: "#2b2b30",
  metalMid: "#4c4c53",
  fabric: "#6b6357",

  // Devices
  deviceBody: "#2e2e38",
  screenGlow: "#9fd4ff",
  screenAccent: "#7cc4ff",
  keycap: "#3a3a42",

  // Accents — a touch more saturated; stylization lives in the chroma
  amber: "#ffb361",
  warmLight: "#ffd9a8",
  coolLight: "#a8c4ff",
  ledGreen: "#6effa8",
  ledBlue: "#6ea8ff",
  plantGreen: "#57833f",
  plantPot: "#9b8470",
  mug: "#d85c42",
} as const;

// far enough that the exterior panorama stays clear of the fog;
// the panorama shader itself opts out of fog entirely
export const fog = {
  color: "#191512",
  near: 11,
  far: 46,
} as const;
