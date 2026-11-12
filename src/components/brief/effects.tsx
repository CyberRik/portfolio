"use client";

/**
 * The louder half of /brief's motion: the hero's opening sequence, things
 * that pop into place as they scroll in, and the pinned "numbers" wall.
 * Modelled on rishipaul.com's hero timeline, its keyboard that presses
 * itself key by key, and its pinned Explorations section.
 *
 * framer-motion's MotionConfig (set in SmoothScroll) reduces all of this
 * to plain fades under prefers-reduced-motion.
 */

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { EASE } from "@/lib/design";
import { Parallax, TransitionLink } from "./motion";

/* ------------------------------------------------------------ hero */

/**
 * The room itself, behind the hero: settles in from a slight zoom, the
 * way the reference site's hero video does. Purely decorative.
 */
export function HeroArt() {
  return (
    <motion.div
      className="brief-hero-art"
      aria-hidden
      initial={{ opacity: 0, scale: 1.08 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.8, ease: EASE.out }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static, decorative, sized by CSS */}
      <img
        src="/brief/room.webp"
        srcSet="/brief/room-960.webp 960w, /brief/room.webp 1920w"
        sizes="100vw"
        alt=""
        fetchPriority="high"
      />
    </motion.div>
  );
}

/** focus-pull entrance: rises out of a blur. For the hero's supporting lines. */
export function BlurIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 1, delay, ease: EASE.out }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------- pop */

/** a springy scale-up with a little overshoot — the "pop" */
const POP = { type: "spring", stiffness: 320, damping: 22, mass: 0.9 } as const;

/** A block that pops into place when it scrolls in. */
export function PopIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.82, y: 48 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ ...POP, delay, opacity: { duration: 0.4, delay } }}
    >
      {children}
    </motion.div>
  );
}

const chipList: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.035, delayChildren: 0.1 } },
};
const chip: Variants = {
  hidden: { opacity: 0, scale: 0.6, y: 10 },
  shown: { opacity: 1, scale: 1, y: 0, transition: POP },
};

/**
 * Chips that pop in one after another when the list scrolls into view —
 * the reference site's keyboard pressing itself, key by key.
 */
export function PopChips({
  items,
  className,
}: {
  items: readonly string[];
  className?: string;
}) {
  return (
    <motion.ul
      className={className}
      variants={chipList}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "-60px" }}
    >
      {items.map((s) => (
        <motion.li key={s} variants={chip}>
          {s}
        </motion.li>
      ))}
    </motion.ul>
  );
}

/* ---------------------------------------------------- numbers wall */

export interface Stat {
  /** the figure, verbatim from the project's results */
  value: string;
  /** what it measures, in one line */
  label: string;
  /** case study it comes from */
  href: string;
  project: string;
}

/**
 * A headline pinned in the middle of the screen while two columns of
 * stat cards scroll up past it at different speeds, each card popping
 * in as it arrives. The pin is plain CSS `position: sticky`; the column
 * speeds are a scrubbed GSAP parallax (desktop only).
 */
export function NumbersWall({
  stats,
  heading,
  sub,
}: {
  stats: Stat[];
  heading: ReactNode;
  sub: string;
}) {
  const left = stats.filter((_, i) => i % 2 === 0);
  const right = stats.filter((_, i) => i % 2 === 1);
  const card = (s: Stat) => (
    <PopIn key={s.value + s.project}>
      <TransitionLink href={s.href} className="brief-stat">
        <span className="brief-stat-value">{s.value}</span>
        <span className="brief-stat-label">{s.label}</span>
        <span className="brief-label">{s.project} →</span>
      </TransitionLink>
    </PopIn>
  );
  return (
    <section className="brief-wall" aria-label="Results in numbers">
      <div className="brief-wall-pin">
        <div>
          {heading}
          <p className="brief-wall-sub">{sub}</p>
          <a href="#work" className="brief-btn">
            See the work ↓
          </a>
        </div>
      </div>
      <div className="brief-wall-cols">
        <Parallax speed={-160} className="brief-wall-col">
          {left.map(card)}
        </Parallax>
        <Parallax speed={-420} className="brief-wall-col brief-wall-col-2">
          {right.map(card)}
        </Parallax>
      </div>
    </section>
  );
}
