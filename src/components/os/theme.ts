"use client";

/**
 * RM-OS's palette, shared by every app on the panel.
 *
 * Lifted out of MonitorScreen when the Timeline and Projects apps grew
 * their own files — the values are unchanged. The screen is a light
 * source IN a warm room, so it can't be cold: graphite chrome with the
 * desk lamp's amber as the only accent.
 */
export const OS = {
  txt: "#ece7dd",
  dim: "#948d80",
  faint: "#6b6459",
  accent: "#ffb361",
  /** hairlines and window edges */
  line: "rgba(255,255,255,0.08)",
  lineSoft: "rgba(255,255,255,0.05)",
  /** panel fills, darkest first */
  sunk: "rgba(0,0,0,0.22)",
  raised: "rgba(255,255,255,0.04)",
} as const;

/** per-app tints — all stay in the warm half so nothing fights the room */
export const APP_TINTS = ["#ffb361", "#e08b6a", "#a8b48c", "#c49ab0"];

/** architecture-diagram node fills, keyed by what the node does */
export const NODE_TINT: Record<string, string> = {
  input: "#948d80",
  core: "#ffb361",
  store: "#a8b48c",
  model: "#c49ab0",
  output: "#e08b6a",
};
