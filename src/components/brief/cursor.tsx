"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * Desktop-only interaction layer for /brief: a custom cursor and the
 * character-matrix spotlight behind the hero.
 *
 * Both are gated on a fine, hovering pointer (a mouse or trackpad), so
 * touch devices never mount them, and both stand down under
 * prefers-reduced-motion. Neither renders anything on the server — the
 * gate is read in an effect — so there is nothing to mismatch during
 * hydration. Both are pointer-events: none, so clicks always land on
 * the page underneath.
 */

const FINE = "(hover: hover) and (pointer: fine)";
const REDUCED = "(prefers-reduced-motion: reduce)";

function useMedia(query: string) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

/* ------------------------------------------------------------------ */

const MAGNET = 0.2;
/** only small targets get pulled — a paragraph link should not wobble */
const MAGNET_MAX = { w: 360, h: 72 };

/**
 * An arrow pointer drawn at the real pointer position (no lag), inverted
 * against whatever is under it (mix-blend-mode: difference), a touch
 * larger over links and buttons.
 */
export function CustomCursor() {
  const fine = useMedia(FINE);
  const reduced = useMedia(REDUCED);
  const enabled = fine && !reduced;

  const dot = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"idle" | "link">("idle");
  const [hidden, setHidden] = useState(true);
  const [down, setDown] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add("has-cursor");

    const target = { x: -100, y: -100 };
    let raf = 0;
    let magnet: HTMLElement | null = null;

    // inline, so it wins over the element's own transition list while
    // pulled, and still carries the colour/underline transitions it had
    const SPRING =
      "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), color 0.25s, background-color 0.25s, background-size 0.5s, border-color 0.25s, opacity 0.3s";
    const release = () => {
      if (magnet) {
        const el = magnet;
        el.style.transform = "";
        setTimeout(() => {
          if (el !== magnet) el.style.transition = "";
        }, 500);
      }
      magnet = null;
    };

    // one write per frame, however many pointer events arrive
    const tick = () => {
      raf = 0;
      if (dot.current) {
        dot.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      target.x = e.clientX;
      target.y = e.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
      setHidden(false);

      const el = e.target instanceof Element ? e.target : null;
      const labelled = el?.closest<HTMLElement>("[data-cursor]");
      const link = el?.closest<HTMLElement>("a, button, summary");
      setMode(link ? "link" : "idle");

      // magnetic pull on small links and buttons, never on the big
      // media cards (marked data-cursor)
      const pull =
        link &&
        !labelled &&
        link.offsetWidth <= MAGNET_MAX.w &&
        link.offsetHeight <= MAGNET_MAX.h
          ? link
          : null;
      if (pull !== magnet) release();
      if (pull) {
        magnet = pull;
        const r = pull.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * MAGNET;
        const dy = (e.clientY - (r.top + r.height / 2)) * MAGNET;
        pull.style.transition = SPRING;
        pull.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      }
    };
    const onLeave = () => {
      setHidden(true);
      release();
    };
    const onDown = () => setDown(true);
    const onUp = () => setDown(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    // pointerleave on document isn't fired everywhere; a mouseout with no
    // relatedTarget is the portable "left the window" signal
    const onWinOut = (e: MouseEvent) => {
      if (!e.relatedTarget) onLeave();
    };
    document.addEventListener("mouseout", onWinOut);
    window.addEventListener("blur", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      cancelAnimationFrame(raf);
      release();
      root.classList.remove("has-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseout", onWinOut);
      window.removeEventListener("blur", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={dot}
      className={`b-cursor ${mode === "link" ? "is-link" : ""} ${hidden ? "is-hidden" : ""} ${down ? "is-down" : ""}`}
      aria-hidden
    >
      <svg
        className="b-cursor-arrow"
        viewBox="0 0 20 24"
        width="16"
        height="19.2"
      >
        <path d="M2 1.5 L2 19.5 L6.8 15.1 L9.9 22.2 L13 20.8 L9.9 13.9 L16.4 13.6 Z" />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** hex, binary, symbols and a few code/AI tokens */
const TOKENS = [
  "0x",
  "0x1f",
  "0xff",
  "0x7a",
  "01",
  "10",
  "1101",
  "0010",
  ">>",
  "<<",
  "λ",
  "//",
  "=>",
  "::",
  "{}",
  "[]",
  "&&",
  "||",
  "fn",
  "def",
  "let",
  "∑",
  "∂",
  "∇",
  "Σ",
  "tok",
  "kv",
  "attn",
  "lr",
  "fp8",
  "nf4",
  "bf16",
  "#",
  "%",
  "*",
  "+",
  "~",
  "^",
  "§",
  "∆",
  "√",
  "≈",
  "≠",
  "→",
  "←",
];
const CHARS = "0123456789abcdef<>/\\{}[]()=+*#%&λΣ∂∇→";
/** what the mono font itself draws at one cell wide */
const ASCII_CHARS = "0123456789abcdef<>/\\{}[]()=+*#%&~^";
const rand = (n: number) => Math.floor(Math.random() * n);
const isAscii = (ch: string) => ch.charCodeAt(0) < 128;

/**
 * The room, drawn in the field's own characters: lamp, monitor, desk,
 * mug. Spaces stay blank (they never scramble), so the shape holds even
 * while the spotlight churns the glyphs; at rest the glyphs settle back.
 */
const ROOM_ART = [
  String.raw`   ___                              `,
  String.raw`  /   \                             `,
  String.raw`  \___/     .--------------------.  `,
  String.raw`      \     | ~/room $ ./walk-in |  `,
  String.raw`       \    |  ==== ===== ==     |  `,
  String.raw`        \   |  ====== == ====    |  `,
  String.raw`        /   |  === ====== =      |  `,
  String.raw`       /    '--------.  .--------'  `,
  String.raw`     _/_             |  |    c[]    `,
  String.raw` ____________________|__|__________ `,
  String.raw`|__________________________________|`,
  String.raw`  ||                            ||  `,
];

function makeRow(width: number, keep = 1) {
  let s = "";
  while (s.length < width) {
    const t = TOKENS[rand(TOKENS.length)];
    // sparse fields drop tokens to blank space, keeping the rhythm
    s +=
      (Math.random() < keep ? t : " ".repeat(t.length)) +
      " ".repeat(1 + rand(2));
  }
  return s.slice(0, width).split("");
}

/**
 * A field of monospace code-ish characters that is invisible until the
 * pointer moves over it: a radial mask follows the cursor, so only a soft
 * circle of characters shows, and the characters inside that circle keep
 * mutating while the pointer moves.
 */
export function MatrixSpotlightBackground({
  className = "",
  room,
  exclude,
  calm = false,
}: {
  className?: string;
  /**
   * Hide the room in the field: ROOM_ART is drawn into the box of an
   * invisible link (placed by .b-hero-room), which leads into the room.
   * Only found by someone sweeping the spotlight over empty space; the
   * footer carries the plain, accessible link.
   */
  room?: boolean;
  /**
   * Elements (a selector) where this field stands aside, because another
   * field is drawn there — the page-wide field yields to the hero's.
   */
  exclude?: string;
  /**
   * The quiet version for behind reading sections: about half the
   * glyphs, a slower drift, and no scrambling — a still texture you
   * uncover, not a second layer of motion under the text.
   */
  calm?: boolean;
}) {
  const fine = useMedia(FINE);
  const reduced = useMedia(REDUCED);
  const box = useRef<HTMLDivElement>(null);
  const pre = useRef<HTMLPreElement>(null);
  const roomRef = useRef<HTMLAnchorElement>(null);

  // Runs on every device: a mouse drives it on desktop, a dragging
  // finger on touch screens (see the touch handlers below).
  useEffect(() => {
    const el = box.current;
    const out = pre.current;
    if (!el || !out) return;

    // size the grid to the box, in character cells
    let cw = 8.4;
    let ch = 18;
    let cols = 0;
    let rows: string[][] = [];
    let lines: HTMLSpanElement[] = [];
    /** cell index → the art's glyph, for cells the drawing owns */
    let art = new Map<number, string>();
    /** rows the drawing crosses: kept ASCII so nothing shifts its columns */
    let artRows = new Set<number>();

    const build = () => {
      const probe = document.createElement("span");
      probe.textContent = "0".repeat(20);
      out.appendChild(probe);
      const pr = probe.getBoundingClientRect();
      cw = pr.width / 20 || cw;
      ch = pr.height || ch;
      probe.remove();
      const r = el.getBoundingClientRect();
      cols = Math.ceil(r.width / cw) + 1;
      const count = Math.ceil(r.height / ch) + 1;
      rows = Array.from({ length: count }, () => makeRow(cols, calm ? 0.5 : 1));

      // carve the room into the field, snapped to the character grid,
      // and size the anchor to the drawing so its hit area matches
      art = new Map();
      artRows = new Set();
      const anchor = room ? roomRef.current : null;
      if (anchor) {
        const w = Math.max(...ROOM_ART.map((l) => l.length));
        anchor.style.width = `${w * cw}px`;
        anchor.style.height = `${ROOM_ART.length * ch}px`;
        const ar = anchor.getBoundingClientRect();
        if (ar.width > 0) {
          const c0 = Math.round((ar.left - r.left) / cw);
          const r0 = Math.round((ar.top - r.top) / ch);
          ROOM_ART.forEach((line, dy) => {
            const rr = r0 + dy;
            if (rr < 0 || rr >= count) return;
            // symbols like λ ∑ come from a fallback font at another width,
            // which would push the drawing off the grid
            artRows.add(rr);
            rows[rr] = rows[rr].map((g) =>
              isAscii(g) ? g : ASCII_CHARS[rand(ASCII_CHARS.length)],
            );
            for (let dx = -1; dx <= w; dx++) {
              const cc = c0 + dx;
              if (cc < 0 || cc >= cols) continue;
              const g = line[dx] ?? " ";
              rows[rr][cc] = g;
              art.set(rr * cols + cc, g);
            }
          });
        }
      }
      out.textContent = "";
      lines = rows.map((row) => {
        const s = document.createElement("span");
        s.textContent = row.join("") + "\n";
        out.appendChild(s);
        return s;
      });
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(el);
    if (room && roomRef.current) ro.observe(roomRef.current);
    // the cell size is measured from the mono font; if it was still
    // loading at mount, the grid (and the room) would sit on the
    // fallback's metrics — rebuild once real fonts are in
    let alive = true;
    document.fonts?.ready.then(() => alive && build());

    // The spotlight eases toward the pointer instead of snapping to it,
    // and fades in/out (--a) as the pointer enters or leaves the box, so
    // moving between places glides rather than jumps. The pointer is kept
    // in viewport coordinates and re-projected each frame, so scrolling
    // with a still mouse doesn't leave the light behind.
    const EASE = calm ? 0.07 : 0.12;
    const FADE = 0.08;
    let px = 0; // pointer, viewport coords
    let py = 0;
    let seen = false;
    let mx = 0; // spotlight, box coords (eased)
    let my = 0;
    let a = 0; // spotlight strength (eased)
    let raf = 0;
    let moving = false;
    let lastMove = 0;

    const frame = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const tx = px - r.left;
      const ty = py - r.top;
      let inside =
        seen && tx >= 0 && ty >= 0 && tx <= r.width && ty <= r.height;
      if (inside && exclude) {
        for (const x of document.querySelectorAll(exclude)) {
          const xr = x.getBoundingClientRect();
          if (
            px >= xr.left &&
            px <= xr.right &&
            py >= xr.top &&
            py <= xr.bottom
          ) {
            inside = false;
            break;
          }
        }
      }
      // while fully faded, jump to the pointer so it fades in where you are
      if (a < 0.01) {
        mx = tx;
        my = ty;
      } else {
        mx += (tx - mx) * EASE;
        my += (ty - my) * EASE;
      }
      a += ((inside ? 1 : 0) - a) * FADE;
      if (!inside && a < 0.005) a = 0;
      el.style.setProperty("--x", `${mx.toFixed(1)}px`);
      el.style.setProperty("--y", `${my.toFixed(1)}px`);
      el.style.setProperty("--a", a.toFixed(3));
      const settled =
        Math.abs(tx - mx) < 0.5 &&
        Math.abs(ty - my) < 0.5 &&
        Math.abs((inside ? 1 : 0) - a) < 0.005;
      if (!settled) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      px = e.clientX;
      py = e.clientY;
      seen = true;
      moving = true;
      lastMove = performance.now();
      kick();
    };
    const onOut = () => {
      seen = false;
      kick();
    };
    // touch: the spotlight follows a dragging finger (which is also the
    // scroll gesture, so it trails the finger down the page) and fades a
    // moment after the finger lifts
    let lift = 0;
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      clearTimeout(lift);
      px = t.clientX;
      py = t.clientY;
      seen = true;
      moving = true;
      lastMove = performance.now();
      kick();
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length) return;
      clearTimeout(lift);
      lift = window.setTimeout(onOut, 450);
    };
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", kick, { passive: true });
    const onWinOut = (e: MouseEvent) => {
      if (!e.relatedTarget) onOut();
    };
    document.addEventListener("mouseout", onWinOut);
    window.addEventListener("blur", onOut);

    // scramble: slow and sparse, only while the pointer is moving, only
    // cells inside the spotlight, only the rows it touched
    const RADIUS = 220;
    const timer =
      reduced || calm
        ? 0
        : window.setInterval(() => {
            if (a < 0.2) return;
            const touched = new Set<number>();
            // at rest, the drawing's scrambled glyphs settle back, a few
            // per tick, so the room resolves out of the noise
            if (!moving && art.size && performance.now() - lastMove > 350) {
              let n = 0;
              for (const [k, g] of art) {
                const r = Math.floor(k / cols);
                const c = k % cols;
                if (rows[r][c] !== g) {
                  rows[r][c] = g;
                  touched.add(r);
                  if (++n >= 24) break;
                }
              }
            }
            if (!moving) {
              touched.forEach((r) => {
                lines[r].textContent = rows[r].join("") + "\n";
              });
              return;
            }
            moving = false;
            for (let i = 0; i < 10; i++) {
              const ang = Math.random() * Math.PI * 2;
              const d = Math.sqrt(Math.random()) * RADIUS * 0.8;
              const c = Math.floor((mx + Math.cos(ang) * d) / cw);
              const r = Math.floor((my + Math.sin(ang) * d) / ch);
              if (r < 0 || r >= rows.length || c < 0 || c >= cols) continue;
              if (rows[r][c] === " ") continue; // keep the token spacing
              rows[r][c] = artRows.has(r)
                ? ASCII_CHARS[rand(ASCII_CHARS.length)]
                : CHARS[rand(CHARS.length)];
              touched.add(r);
            }
            touched.forEach((r) => {
              lines[r].textContent = rows[r].join("") + "\n";
            });
          }, 140);

    return () => {
      alive = false;
      ro.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(lift);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", kick);
      document.removeEventListener("mouseout", onWinOut);
      window.removeEventListener("blur", onOut);
      clearInterval(timer);
    };
  }, [fine, reduced, room, exclude, calm]); // fine: the room link mounts with it

  return (
    <>
      <div ref={box} className={`b-matrix ${className}`} aria-hidden>
        <pre ref={pre} />
      </div>
      {room && fine && (
        <Link
          ref={roomRef}
          href="/"
          prefetch={false}
          className="b-hero-room"
          data-cursor="ENTER ROOM"
          tabIndex={-1}
          aria-hidden
        />
      )}
    </>
  );
}
