"use client";

/**
 * Reading progress: a short, fixed track centred on the left edge that
 * an amber blade fills as you read, white-hot at its tip. The blade is
 * a track-sized strip slid down into view (translateY(progress − 100%)),
 * not scaled, so the tip keeps its shape at any fill. One passive scroll listener, one transform
 * per animation frame — nothing else.
 */

import { useEffect, useRef } from "react";

export function ScrollBeam() {
  const beam = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      if (beam.current)
        beam.current.style.transform = `translateY(${(p - 1) * 100}%)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll, { passive: true });
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <span className="brief-beam" aria-hidden>
      <span ref={beam} className="brief-beam-blade" />
    </span>
  );
}
