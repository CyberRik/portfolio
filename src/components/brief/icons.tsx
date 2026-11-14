"use client";

/**
 * Animated emoji beside each section title — Google's Noto Animated
 * Emoji (CC BY 4.0, credited in the footer), played with lottie-web.
 *
 * Behaviour: the icon shows its finished pose as soon as it loads, plays
 * through once when its section scrolls in, and comes to rest on that
 * pose again. Hovering the heading replays it. No endless loops.
 *
 * Two traps this is built around:
 *  - Some of these animations start or end empty (the seedling begins as
 *    a falling drop and fades out at the end). Looping them meant the
 *    icon kept going blank and read as "didn't load". Each one plays
 *    once up to its rest frame (REST_FRAME) and holds there.
 *  - The icon sits inside the title's mask reveal, so it is clipped out
 *    of view until that animation finishes; observing the icon itself
 *    meant a quick scroll could pass without it ever counting as
 *    visible. We observe the (never clipped) heading instead.
 *
 * Kept light: the light SVG build of the player is imported on demand,
 * and each animation's JSON (2–12KB gzipped) is fetched only when its
 * heading nears the screen.
 */

import { useEffect, useRef } from "react";

export type IconName =
  | "rocket"
  | "sparkles"
  | "seedling"
  | "trophy"
  | "gear"
  | "wave";

/**
 * Where each animation comes to rest. Most end on their full pose; the
 * seedling grows in, then fades out to nothing by its last frame
 * (measured: fully grown ~230–260 of 345), so it stops mid-way.
 */
const REST_FRAME: Partial<Record<IconName, number>> = { seedling: 250 };

export function SectionIcon({ name }: { name: IconName }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const head = (el.closest("header") as HTMLElement | null) ?? el;
    let anim: import("lottie-web").AnimationItem | undefined;
    let cancelled = false;
    let played = false;
    let seen = false;
    let loading = false;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const restAt = () =>
      Math.min(REST_FRAME[name] ?? Infinity, (anim?.totalFrames ?? 1) - 1);
    const rest = () => anim?.goToAndStop(restAt(), true);
    const play = () => {
      if (!anim || still) return;
      anim.playSegments([0, restAt()], true);
    };

    const load = async () => {
      loading = true;
      try {
        const [{ default: lottie }, data] = await Promise.all([
          import("lottie-web/build/player/lottie_light"),
          fetch(`/lottie/${name}.json`).then((r) => r.json()),
        ]);
        if (cancelled) return;
        anim = lottie.loadAnimation({
          container: el,
          renderer: "svg",
          loop: false,
          autoplay: false,
          animationData: data,
        });
        anim.addEventListener("complete", rest);
        rest();
        if (seen && !played) {
          played = true;
          play();
        }
      } catch {
        // a failed fetch leaves the empty, fixed-size slot — never a
        // broken layout
      }
    };

    // fetch a little before the heading arrives…
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        if (!loading) load();
        io.disconnect();
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(head);
    // …but play only once it is actually on screen, after the title's
    // own reveal has mostly landed
    let timer = 0;
    const seenIo = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        seenIo.disconnect();
        timer = window.setTimeout(() => {
          seen = true;
          if (anim && !played) {
            played = true;
            play();
          }
        }, 450);
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    seenIo.observe(head);

    const onEnter = () => play();
    head.addEventListener("pointerenter", onEnter);

    return () => {
      cancelled = true;
      io.disconnect();
      seenIo.disconnect();
      clearTimeout(timer);
      head.removeEventListener("pointerenter", onEnter);
      anim?.destroy();
    };
  }, [name]);

  return <span ref={ref} className="brief-icon" aria-hidden />;
}
