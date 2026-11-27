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
 * A dot that trails the pointer with a little lag, inverts whatever is
 * under it (mix-blend-mode: difference), grows over links and buttons,
 * and becomes a labelled pill over anything carrying data-cursor="…".
 */
export function CustomCursor() {
  const fine = useMedia(FINE);
  const reduced = useMedia(REDUCED);
  const enabled = fine && !reduced;

  const dot = useRef<HTMLDivElement>(null);
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
        dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
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

  const state = label ? "is-label" : mode === "link" ? "is-link" : "";
  return (
    <div
      ref={dot}
      className={`b-cursor ${state} ${hidden ? "is-hidden" : ""} ${down ? "is-down" : ""}`}
      aria-hidden
    >
      <span className="b-cursor-shape">
        <span className="b-cursor-label">{label}</span>
      </span>
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

    // spotlight position, written straight to CSS variables
    let mx = -9999;
    let my = -9999;
    let moving = false;
    let pending = false;
    const paint = () => {
      pending = false;
      el.style.setProperty("--x", `${mx}px`);
      el.style.setProperty("--y", `${my}px`);
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
      moving = true;
      if (!pending) {
        pending = true;
        requestAnimationFrame(paint);
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // scramble: a throttled interval, only while the pointer is moving,
    // only cells inside the spotlight, only the rows it touched
    const RADIUS = 250;
    const timer = reduced
      ? 0
      : window.setInterval(() => {
          if (!moving) return;
          moving = false;
          const touched = new Set<number>();
          for (let i = 0; i < 26; i++) {
            const a = Math.random() * Math.PI * 2;
            const d = Math.sqrt(Math.random()) * RADIUS * 0.8;
            const c = Math.floor((mx + Math.cos(a) * d) / cw);
            const r = Math.floor((my + Math.sin(a) * d) / ch);
            if (r < 0 || r >= rows.length || c < 0 || c >= cols) continue;
            if (rows[r][c] === " ") continue; // keep the token spacing
            rows[r][c] = CHARS[rand(CHARS.length)];
            touched.add(r);
          }
          touched.forEach((r) => {
            lines[r].textContent = rows[r].join("") + "\n";
          });
        }, 70);

    return () => {
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      clearInterval(timer);
    };
  }, [fine, reduced]);

  return (
    <div ref={box} className={`b-matrix ${className}`} aria-hidden>
      <pre ref={pre} />
    </div>
  );
}
