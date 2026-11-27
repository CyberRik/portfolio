"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion } from "framer-motion";

/**
 * A muted, looping clip that only plays while it is on screen.
 *
 * Nothing is fetched until the clip comes near the viewport
 * (preload="none" + the observer's rootMargin), it pauses when it
 * leaves, and with reduced motion it never plays at all: the poster
 * frame stands in, which is the same image the first frame would show.
 */
export function Clip({
  src,
  poster,
  className,
  label,
}: {
  src: string;
  poster: string;
  className?: string;
  /** what the clip shows, for screen readers */
  label: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (v.preload === "none") v.preload = "auto";
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-label={label}
    />
  );
}

const spring = (delay: number) => ({
  type: "spring" as const,
  stiffness: 70,
  damping: 16,
  mass: 0.9,
  delay,
  opacity: { duration: 0.5, delay, ease: "easeOut" as const },
});

/**
 * The reference site's entrance: a card rises from well below, a little
 * small, and settles with a soft spring as it scrolls into view. `delay`
 * staggers siblings so a group arrives one after another.
 *
 * Inside a <PopGroup>, pass `grouped`: the card then waits for the group
 * to enter instead of watching itself. That matters inside a clipping
 * parent (overflow: hidden) — a card that starts pushed below the clip
 * edge is invisible to its own observer and would never be revealed.
 */
export function PopUp({
  children,
  className,
  delay = 0,
  distance = 120,
  as = "div",
  grouped = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  as?: "div" | "li";
  grouped?: boolean;
}) {
  const Tag = motion[as];
  const variants = {
    hidden: { opacity: 0, y: distance, scale: 0.94 },
    shown: { opacity: 1, y: 0, scale: 1, transition: spring(delay) },
  };
  return grouped ? (
    <Tag className={className} variants={variants}>
      {children}
    </Tag>
  ) : (
    <Tag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </Tag>
  );
}

/** Reveals every grouped <PopUp> inside it once the group is on screen. */
export function PopGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "-40px" }}
    >
      {children}
    </motion.div>
  );
}
