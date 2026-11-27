"use client";

import { useEffect, useRef, useState } from "react";

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

const LERP = 0.18;
const MAGNET = 0.2;
/** only small targets get pulled — a paragraph link should not wobble */
const MAGNET_MAX = { w: 360, h: 72 };

/**
 * An arrow pointer drawn at the real pointer position (no lag), inverted
 * against whatever is under it (mix-blend-mode: difference), a touch
 * larger over links and buttons. Over anything carrying data-cursor="…"
 * a labelled pill trails just behind the arrow with a little lag.
 */
export function CustomCursor() {
  const fine = useMedia(FINE);
  const reduced = useMedia(REDUCED);
  const enabled = fine && !reduced;

  const dot = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [mode, setMode] = useState<"idle" | "link">("idle");
  const [hidden, setHidden] = useState(true);
  const [down, setDown] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add("has-cursor");

    const target = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
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

    const tick = () => {
      pos.x += (target.x - pos.x) * LERP;
      pos.y += (target.y - pos.y) * LERP;
      if (dot.current) {
        dot.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
      }
      if (pill.current) {
        pill.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      target.x = e.clientX;
      target.y = e.clientY;
      setHidden(false);

      const el = e.target instanceof Element ? e.target : null;
      const labelled = el?.closest<HTMLElement>("[data-cursor]");
      const link = el?.closest<HTMLElement>("a, button, summary");
      setLabel(labelled?.dataset.cursor ?? null);
      setMode(link ? "link" : "idle");

      // magnetic pull on small links and buttons, never on labelled cards
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
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      cancelAnimationFrame(raf);
      release();
      root.classList.remove("has-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [enabled]);

  if (!enabled) return null;

  const flags = `${hidden ? "is-hidden" : ""} ${down ? "is-down" : ""}`;
  return (
    <>
      <div
        ref={dot}
        className={`b-cursor ${mode === "link" && !label ? "is-link" : ""} ${flags}`}
        aria-hidden
      >
        <svg className="b-cursor-arrow" viewBox="0 0 20 24" width="20" height="24">
          <path d="M2 1.5 L2 19.5 L6.8 15.1 L9.9 22.2 L13 20.8 L9.9 13.9 L16.4 13.6 Z" />
        </svg>
      </div>
      <div
        ref={pill}
        className={`b-cursor-pill ${label ? "is-on" : ""} ${flags}`}
        aria-hidden
      >
        <span className="b-cursor-label">{label}</span>
      </div>
    </>
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
const rand = (n: number) => Math.floor(Math.random() * n);

function makeRow(width: number) {
  let s = "";
  while (s.length < width)
    s += TOKENS[rand(TOKENS.length)] + " ".repeat(1 + rand(2));
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
}: {
  className?: string;
}) {
  const fine = useMedia(FINE);
  const reduced = useMedia(REDUCED);
  const box = useRef<HTMLDivElement>(null);
  const pre = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (!fine) return;
    const el = box.current;
    const out = pre.current;
    if (!el || !out) return;

    // size the grid to the box, in character cells
    let cw = 8.4;
    let ch = 18;
    let cols = 0;
    let rows: string[][] = [];
    let lines: HTMLSpanElement[] = [];

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
      rows = Array.from({ length: count }, () => makeRow(cols));
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

    // The spotlight eases toward the pointer instead of snapping to it,
    // and fades in/out (--a) as the pointer enters or leaves the box, so
    // moving between places glides rather than jumps. The pointer is kept
    // in viewport coordinates and re-projected each frame, so scrolling
    // with a still mouse doesn't leave the light behind.
    const EASE = 0.12;
    const FADE = 0.08;
    let px = 0; // pointer, viewport coords
    let py = 0;
    let seen = false;
    let mx = 0; // spotlight, box coords (eased)
    let my = 0;
    let a = 0; // spotlight strength (eased)
    let raf = 0;
    let moving = false;

    const frame = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const tx = px - r.left;
      const ty = py - r.top;
      const inside =
        seen && tx >= 0 && ty >= 0 && tx <= r.width && ty <= r.height;
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
      kick();
    };
    const onOut = () => {
      seen = false;
      kick();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", kick, { passive: true });
    document.addEventListener("pointerleave", onOut);
    window.addEventListener("blur", onOut);

    // scramble: slow and sparse, only while the pointer is moving, only
    // cells inside the spotlight, only the rows it touched
    const RADIUS = 220;
    const timer = reduced
      ? 0
      : window.setInterval(() => {
          if (!moving || a < 0.2) return;
          moving = false;
          const touched = new Set<number>();
          for (let i = 0; i < 10; i++) {
            const ang = Math.random() * Math.PI * 2;
            const d = Math.sqrt(Math.random()) * RADIUS * 0.8;
            const c = Math.floor((mx + Math.cos(ang) * d) / cw);
            const r = Math.floor((my + Math.sin(ang) * d) / ch);
            if (r < 0 || r >= rows.length || c < 0 || c >= cols) continue;
            if (rows[r][c] === " ") continue; // keep the token spacing
            rows[r][c] = CHARS[rand(CHARS.length)];
            touched.add(r);
          }
          touched.forEach((r) => {
            lines[r].textContent = rows[r].join("") + "\n";
          });
        }, 140);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", kick);
      document.removeEventListener("pointerleave", onOut);
      window.removeEventListener("blur", onOut);
      clearInterval(timer);
    };
  }, [fine, reduced]);

  return (
    <div ref={box} className={`b-matrix ${className}`} aria-hidden>
      <pre ref={pre} />
    </div>
  );
}
