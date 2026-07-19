"use client";

/**
 * The "back out" gesture. Any key leaves the current world — Esc was
 * never discoverable, and once you're inside a world there is nothing
 * else for the keyboard to do.
 *
 * Deliberately NOT every keydown, or the browser stops working
 * underneath us. Three classes are excluded:
 *
 *   - modifier combos (Ctrl/Cmd/Alt held), so Cmd+R, Ctrl+C, Alt+Tab
 *     still belong to the browser instead of dismissing the world
 *   - bare modifier presses, so resting a finger on Shift does nothing
 *   - keys typed into a field, in case a world ever grows a real input
 *     (today none do — the compose window types itself)
 */
const BARE_MODIFIERS = new Set([
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "AltGraph",
  "CapsLock",
  "NumLock",
  "ScrollLock",
  "Fn",
  "FnLock",
  "Super",
  "Hyper",
  "OS",
  "Dead",
]);

export function isExitKey(e: KeyboardEvent): boolean {
  // Auto-repeat. Holding a key fires keydown every ~30ms, and each one
  // used to restart the fly-home: the timeline was killed and a fresh
  // full-length flight began from wherever the camera had crept to, so
  // holding a key made the camera crawl instead of travel — and letting
  // go mid-flight could strand it partway. One press, one flight.
  if (e.repeat) return false;

  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  if (e.isComposing) return false;
  if (BARE_MODIFIERS.has(e.key)) return false;

  const el = e.target as HTMLElement | null;
  if (el) {
    const tag = el.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return false;
    if (el.isContentEditable) return false;
  }
  return true;
}
