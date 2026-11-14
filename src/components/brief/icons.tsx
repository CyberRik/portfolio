"use client";

/**
 * Animated emoji beside each section title — Google's Noto Animated
 * Emoji (CC BY 4.0, credited in the footer), played with lottie-web.
 *
 * Kept light:
 *  - the light SVG-only build of the player, imported on demand: it
 *    isn't in the page bundle, and loads the first time an icon nears
 *    the screen
 *  - each animation's JSON (2–12KB gzipped, in /public/lottie) is
 *    fetched only when its own title nears the screen
 *  - it plays only while visible and pauses off screen, so at most a
 *    couple are ever running
 *  - under prefers-reduced-motion it shows a still frame
 */

import { useEffect, useRef } from "react";

export type IconName =
  | "rocket"
  | "sparkles"
  | "seedling"
  | "trophy"
  | "gear"
  | "wave";

export function SectionIcon({ name }: { name: IconName }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let anim: import("lottie-web").AnimationItem | undefined;
    let visible = false;
    let cancelled = false;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const load = async () => {
      const [{ default: lottie }, data] = await Promise.all([
        import("lottie-web/build/player/lottie_light"),
        fetch(`/lottie/${name}.json`).then((r) => r.json()),
      ]);
      if (cancelled) return;
      anim = lottie.loadAnimation({
        container: el,
        renderer: "svg",
        loop: !still,
        autoplay: false,
        animationData: data,
      });
      if (still) anim.goToAndStop(anim.totalFrames - 1, true);
      else if (visible) anim.play();
    };

    let started = false;
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible && !started) {
          started = true;
          load();
        }
        if (!anim || still) return;
        if (visible) anim.play();
        else anim.pause();
      },
      // start fetching a little before it arrives
      { rootMargin: "200px 0px" },
    );
    io.observe(el);

    return () => {
      cancelled = true;
      io.disconnect();
      anim?.destroy();
    };
  }, [name]);

  return <span ref={ref} className="brief-icon" aria-hidden />;
}
