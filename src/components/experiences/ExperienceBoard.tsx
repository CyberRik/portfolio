"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EXPERIENCE } from "@/content/portfolio";
import type { PortalProps } from "./ExperienceOverlay";
import { WORLD_FADE } from "@/lib/design";

/**
 * EXPERIENCE — the whiteboard comes alive.
 *
 * Identity: the ONLY light world. Marker on board. A career flow
 * diagram draws itself stroke by stroke — boxes, arrows, underlines —
 * in real whiteboard-marker colors, with handwriting for the labels.
 * Clicking a node "writes" that role's story. Nothing is static;
 * everything is drawn.
 */

const MARKER = "var(--font-caveat), cursive";
const INK = "#26262e"; // black marker
const BLUE = "#2f5fc4";
const RED = "#c8402f";

/** node layout on a 1600×900 board, chronological left → right */
const NODES = [
  { x: 150, y: 560, w: 290, h: 130, tilt: -1.2 }, // Tecnod8
  { x: 520, y: 250, w: 300, h: 130, tilt: 0.8 }, // OctonData
  { x: 900, y: 560, w: 300, h: 130, tilt: -0.7 }, // Gravton
  { x: 1270, y: 250, w: 300, h: 130, tilt: 1.0 }, // Otsuka
];

/** hand-bowed arrows between consecutive nodes */
const ARROWS = [
  "M 445 590 C 520 560, 500 420, 545 375",
  "M 825 320 C 900 360, 880 500, 925 555",
  "M 1205 590 C 1280 560, 1255 420, 1300 375",
];

/**
 * tiny marker sketches — one per stop, its domain in a few strokes:
 * an automation bot, a parsed document, a retrieval graph, a torii
 * gate for Tokyo. Each sits above its node and draws on after it.
 */
const DOODLES: { at: [number, number]; color: string; paths: string[] }[] = [
  // Tecnod8 — little automation bot
  {
    at: [355, 460],
    color: INK,
    paths: [
      "M 12 26 h 38 v 28 h -38 Z",
      "M 23 39 a 3 3 0 1 0 0.1 0",
      "M 40 39 a 3 3 0 1 0 0.1 0",
      "M 31 26 v -9 m -4 -4 a 4 4 0 1 1 8 0",
    ],
  },
  // OctonData — a parsed document
  {
    at: [745, 152],
    color: BLUE,
    paths: [
      "M 14 8 h 26 l 10 11 v 42 h -36 Z",
      "M 40 8 v 11 h 10",
      "M 22 32 h 20 M 22 41 h 20 M 22 50 h 13",
    ],
  },
  // Gravton — retrieval graph
  {
    at: [1125, 455],
    color: INK,
    paths: [
      "M 16 48 L 34 16 L 56 40 L 38 58 L 16 48",
      "M 16 48 a 4 4 0 1 0 0.1 0",
      "M 34 16 a 4 4 0 1 0 0.1 0",
      "M 56 40 a 4 4 0 1 0 0.1 0",
      "M 38 58 a 4 4 0 1 0 0.1 0",
    ],
  },
  // Otsuka — torii gate, Tokyo
  {
    at: [1490, 150],
    color: RED,
    paths: ["M 6 20 C 20 12, 44 12, 58 20", "M 12 30 h 40", "M 18 26 v 32 M 46 26 v 32"],
  },
];

// EXPERIENCE is newest-first; the board reads oldest → newest
const ROLES = [...EXPERIENCE].reverse();

export function ExperienceBoard({ onClose }: PortalProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const draw = (delay: number, dur = 0.55) => ({
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { delay, duration: dur, ease: "easeInOut" as const, opacity: { delay, duration: 0.01 } },
  });

  return (
    <motion.div className="absolute inset-0 overflow-hidden bg-[#f2eee4]" {...WORLD_FADE}>
      {/* faint board texture: old ghost strokes */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          background:
            "repeating-linear-gradient(105deg, transparent 0 180px, #8a8578 180px 181px, transparent 181px 400px)",
        }}
      />

      {/* title — written first */}
      <motion.p
        className="absolute top-8 left-10 text-[44px] leading-none"
        style={{ fontFamily: MARKER, color: INK }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        where I&apos;ve worked
      </motion.p>
      <svg className="absolute top-[84px] left-10 h-4 w-[300px]" viewBox="0 0 300 16">
        <motion.path
          d="M 4 10 C 80 4, 200 14, 296 7"
          fill="none"
          stroke={RED}
          strokeWidth={4}
          strokeLinecap="round"
          {...draw(1.15, 0.4)}
        />
      </svg>

      {/* the diagram draws itself */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid meet"
      >
        {NODES.map((n, i) => {
          const d = 1.4 + i * 0.75;
          const r = ROLES[i];
          const active = selected === i;
          return (
            <g
              key={r.company}
              transform={`rotate(${n.tilt} ${n.x + n.w / 2} ${n.y + n.h / 2})`}
              className="cursor-pointer"
              onClick={() => setSelected(active ? null : i)}
            >
              {/* marker rectangle, drawn */}
              <motion.path
                d={`M ${n.x} ${n.y} h ${n.w} v ${n.h} h ${-n.w} Z`}
                fill="rgba(255,255,255,0.5)"
                stroke={active ? BLUE : INK}
                strokeWidth={active ? 4.5 : 3.5}
                strokeLinejoin="round"
                {...draw(d)}
              />
              <motion.text
                x={n.x + 22}
                y={n.y + 52}
                style={{ fontFamily: MARKER }}
                fontSize={36}
                fill={INK}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: d + 0.35, duration: 0.4 }}
              >
                {r.company}
              </motion.text>
              <motion.text
                x={n.x + 22}
                y={n.y + 88}
                style={{ fontFamily: MARKER }}
                fontSize={23}
                fill={BLUE}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: d + 0.5, duration: 0.4 }}
              >
                {r.title.toLowerCase()}
              </motion.text>
              <motion.text
                x={n.x + 22}
                y={n.y + 116}
                style={{ fontFamily: MARKER }}
                fontSize={20}
                fill="#6d685c"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: d + 0.6, duration: 0.4 }}
              >
                {r.period}
              </motion.text>
            </g>
          );
        })}

        {ARROWS.map((a, i) => (
          <g key={a}>
            <motion.path
              d={a}
              fill="none"
              stroke={BLUE}
              strokeWidth={3.5}
              strokeLinecap="round"
              {...draw(2.0 + i * 0.75, 0.5)}
            />
          </g>
        ))}

        {/* the sketches — drawn after their node settles */}
        {DOODLES.map((dl, i) => (
          <g key={i} transform={`translate(${dl.at[0]} ${dl.at[1]})`}>
            {dl.paths.map((p, j) => (
              <motion.path
                key={p}
                d={p}
                fill="none"
                stroke={dl.color}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                {...draw(2.15 + i * 0.75 + j * 0.14, 0.35)}
              />
            ))}
          </g>
        ))}

        {/* margin annotations, in red marker */}
        <motion.text
          x={158}
          y={528}
          style={{ fontFamily: MARKER }}
          fontSize={26}
          fill={RED}
          transform="rotate(-3 158 528)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.1, duration: 0.5 }}
        >
          started here
        </motion.text>
        <motion.text
          x={1272}
          y={228}
          style={{ fontFamily: MARKER }}
          fontSize={26}
          fill={RED}
          transform="rotate(2 1272 228)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.3, duration: 0.5 }}
        >
          now — tokyo
        </motion.text>
      </svg>

      {/* the story of the selected node gets written below the board */}
      <AnimatePresence mode="wait">
        {selected !== null && (
          <motion.div
            key={selected}
            className="absolute right-10 bottom-16 left-10 mx-auto max-w-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            {/* solid — a sheet of paper ON the board, boxes must not bleed through */}
            <div className="rounded-sm border border-[#d9d3c4] bg-[#fbf8f1] px-8 py-5 shadow-[0_14px_40px_rgba(60,50,30,0.18)]">
              <p className="text-[26px]" style={{ fontFamily: MARKER, color: BLUE }}>
                {ROLES[selected].company} — {ROLES[selected].location.toLowerCase()}
              </p>
              <ul className="mt-2 space-y-1.5">
                {ROLES[selected].bullets.map((b, i) => (
                  <motion.li
                    key={b}
                    className="flex gap-3 text-[19px] leading-snug"
                    style={{ fontFamily: MARKER, color: INK }}
                    initial={{ opacity: 0, y: 6, rotate: -0.4 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    transition={{ delay: 0.1 + i * 0.16, duration: 0.35 }}
                  >
                    <span style={{ color: RED }}>→</span>
                    <span>{b}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* quiet hints, in the room's own voice */}
      <motion.p
        className="absolute right-10 bottom-6 font-mono text-[10px] tracking-[0.25em] text-[#a29b8a] uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4.2, duration: 0.8 }}
      >
        click a box · esc — step back
      </motion.p>
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-8 right-10 text-[30px] leading-none text-[#6d685c] transition-colors hover:text-[#c8402f]"
        style={{ fontFamily: MARKER }}
      >
        ✕
      </button>
    </motion.div>
  );
}
