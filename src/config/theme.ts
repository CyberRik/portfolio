/**
 * Global visual language of the workspace.
 * Warm, expensive, minimal — Apple / Linear / Anthropic, not gaming.
 */
export const palette = {
  // Architecture
  wall: "#312d29",
  wallAccent: "#3a352f",
  floor: "#4a3c30",
  ceiling: "#2b2825",
  rug: "#26221f",

  // Furniture
  deskTop: "#8a6a4b",
  deskLeg: "#1d1b19",
  woodDark: "#4e3b2a",
  woodLight: "#a07d58",
  metalDark: "#1a1a1c",
  metalMid: "#3c3c40",
  fabric: "#5c554c",

  // Devices
  deviceBody: "#22222a",
  screenGlow: "#9fd4ff",
  screenAccent: "#7cc4ff",
  keycap: "#2d2d33",

  // Accents
  amber: "#ffb361",
  warmLight: "#ffd9a8",
  coolLight: "#a8c4ff",
  ledGreen: "#6effa8",
  ledBlue: "#6ea8ff",
  plantGreen: "#4a6b3a",
  plantPot: "#8a7563",
  mug: "#c9553d",
} as const;

export const fog = {
  color: "#191512",
  near: 9,
  far: 28,
} as const;
