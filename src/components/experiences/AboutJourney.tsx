"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { PROFILE } from "@/content/portfolio";
import type { PortalProps } from "./ExperienceOverlay";
import { WORLD_FADE } from "@/lib/design";

/**
 * ABOUT — the world outside the window.
 *
 * Identity: celestial. The night sky becomes a constellation — each
 * star a place, connecting into one path: West Bengal, Madras, the
 * remote coasts, Tokyo, and an open node for what's next. The slowest,
 * quietest portal: everything drifts, nothing hurries.
 */

const STOPS = [
  { x: 160, y: 640, place: "West Bengal, India", note: "roots · 98.61 %ile JEE among 1.2M" },
  { x: 430, y: 500, place: "IIT Madras", note: "b.tech 2023 – 2027" },
  { x: 700, y: 580, place: "San Francisco — remote", note: "OctonData · document intelligence" },
  { x: 950, y: 430, place: "Ontario — remote", note: "Gravton Labs · retrieval at scale" },
  { x: 1200, y: 520, place: "Tokyo, Japan", note: "Otsuka · LLM training & agents" },
  { x: 1440, y: 360, place: "2027 —", note: "next chapter, unwritten" },
];

const PATH = STOPS.map((s, i) => `${i === 0 ? "M" : "L"} ${s.x} ${s.y}`).join(" ");

export function AboutJourney({ onClose }: PortalProps) {
  // deterministic pseudo-random starfield — stable across renders
  const stars = useMemo(() => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    return Array.from({ length: 110 }, () => ({
      x: rnd() * 100,
      y: rnd() * 100,
      r: 0.6 + rnd() * 1.4,
      d: rnd() * 6,
    }));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #040711 0%, #0a1122 55%, #131b31 100%)",
      }}
      {...WORLD_FADE}
    >
      {/* starfield — two layers drifting at different rates, slow twinkle */}
      {[0, 1].map((layer) => (
        <div
          key={layer}
          className={`absolute -inset-20 ${layer === 0 ? "star-layer-a" : "star-layer-b"}`}
        >
          {stars
            .filter((_, i) => i % 2 === layer)
            .map((s, i) => (
              <span
                key={i}
                className="star-twinkle absolute rounded-full bg-[#cdd8ee]"
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  width: s.r,
                  height: s.r,
                  animationDelay: `${s.d}s`,
                }}
              />
            ))}
        </div>
      ))}

      {/* every few seconds, a meteor */}
      <span className="shooting-star" style={{ top: "16%", left: "68%", animationDelay: "4s" }} />
      <span className="shooting-star" style={{ top: "9%", left: "34%", animationDelay: "10.5s" }} />

      {/* the journey constellation */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid meet"
      >
        <motion.path
          d={PATH}
          fill="none"
          stroke="#8fa8d8"
          strokeWidth={1.2}
          strokeDasharray="1 7"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 1.6, duration: 4.5, ease: "easeInOut" }}
        />
        {STOPS.map((s, i) => {
          const last = i === STOPS.length - 1;
          const d = 1.6 + (i / (STOPS.length - 1)) * 4.2;
          return (
            <g key={s.place}>
              <motion.circle
                cx={s.x}
                cy={s.y}
                r={last ? 7 : 4.5}
                fill={last ? "transparent" : "#e6edfb"}
                stroke="#e6edfb"
                strokeWidth={last ? 1.2 : 0}
                strokeDasharray={last ? "3 4" : undefined}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: d, duration: 0.8, ease: "easeOut" }}
                style={{ filter: "drop-shadow(0 0 6px #9db4e4)" }}
              />
              {last && (
                <motion.circle
                  cx={s.x}
                  cy={s.y}
                  r={7}
                  fill="none"
                  stroke="#9db4e4"
                  strokeWidth={1}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.8, 0], scale: [1, 2.1, 2.6] }}
                  transition={{ delay: d + 0.5, duration: 3, repeat: Infinity, ease: "easeOut" }}
                />
              )}
              {/* last stop labels to the LEFT so nothing clips off-frame */}
              <motion.text
                x={last ? s.x - 16 : s.x + 14}
                y={s.y - 14}
                textAnchor={last ? "end" : "start"}
                fill="#dbe5f7"
                fontSize={17}
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: d + 0.35, duration: 1.0 }}
              >
                {s.place}
              </motion.text>
              <motion.text
                x={last ? s.x - 16 : s.x + 14}
                y={s.y + 8}
                textAnchor={last ? "end" : "start"}
                fill="#71829f"
                fontSize={12}
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: d + 0.55, duration: 1.0 }}
              >
                {s.note}
              </motion.text>
            </g>
          );
        })}
      </svg>

      {/* who is travelling */}
      <motion.div
        className="absolute top-14 left-14 max-w-md"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="font-mono text-[11px] tracking-[0.4em] text-[#71829f] uppercase">
          the journey so far
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-[#c3cfe4]">{PROFILE.summary}</p>
        <motion.a
          href={PROFILE.resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-full border border-[#4a5a7c] px-4 py-1.5 font-mono text-[11px] tracking-[0.2em] text-[#9db4e4] uppercase transition-colors hover:border-[#9db4e4] hover:text-[#e6edfb]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 5.5, duration: 1 }}
        >
          the full record ↗
        </motion.a>
      </motion.div>

      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-8 right-10 font-mono text-[11px] tracking-[0.25em] text-[#71829f] uppercase transition-colors hover:text-[#e6edfb]"
      >
        esc — return to the room
      </button>
    </motion.div>
  );
}
