"use client";

/**
 * Motion primitives for /brief — the flat, readable twin of the room.
 *
 * The vocabulary is borrowed from editorial portfolio sites (rishipaul.com
 * was the reference): Lenis smooth scroll driving GSAP's ScrollTrigger,
 * headings that rise out of a mask, blocks that unclip as they enter, a
 * little scrubbed parallax, and View Transitions between pages. The
 * curves are our own EASE tokens so the page moves with the same hand as
 * the room.
 *
 * Everything here respects prefers-reduced-motion: Lenis is never started,
 * ScrollTrigger tweens are skipped, page transitions fall back to plain
 * navigation, and MotionConfig makes framer-motion drop transforms and
 * keep only opacity.
 */

import {
  useEffect,
  useRef,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { MotionConfig, motion } from "framer-motion";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EASE } from "@/lib/design";

// once, at module level — never inside a component that re-renders
if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** the live Lenis instance, so navigation can reset it */
let lenisRef: Lenis | null = null;

/** resolves the in-flight view transition once the new route has painted */
let finishTransition: (() => void) | null = null;

/* ------------------------------------------------------------------ */

/**
 * Lenis on the window, ticked by GSAP's ticker so ScrollTrigger and the
 * smooth scroll read the same frame. In-page anchor links get a long,
 * eased glide instead of a jump.
 *
 * Also owns the two things that must happen on every route change:
 * landing at the top (or the hash target) and finishing the page
 * transition that TransitionLink started.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (reducedMotion()) return;

    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.09,
      anchors: { duration: 1.4, offset: -24 },
    });
    lenisRef = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef = null;
    };
  }, []);

  // ScrollTrigger measures trigger positions once. Anything that changes
  // the page height afterwards — opening a "+ 2 more" in Experience, a
  // late web font, the next route's content — leaves every trigger below
  // it stale, so re-measure whenever the document resizes.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(t);
      t = setTimeout(() => ScrollTrigger.refresh(), 150);
    };
    const ro = new ResizeObserver(refresh);
    ro.observe(document.body);
    document.fonts?.ready.then(refresh);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    const target = hash ? document.querySelector(hash) : null;
    if (target instanceof HTMLElement) {
      // arriving at /brief#work from a case study: land on the section
      const y = target.getBoundingClientRect().top + window.scrollY - 24;
      if (lenisRef) lenisRef.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
    } else if (lenisRef) {
      lenisRef.scrollTo(0, { immediate: true, force: true });
    } else {
      window.scrollTo(0, 0);
    }
    // let the new page paint once before the transition reveals it
    requestAnimationFrame(() => {
      finishTransition?.();
      finishTransition = null;
    });
  }, [pathname]);

  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/* ------------------------------------------------------------------ */

type ViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => Promise<void>) => unknown;
};

/**
 * A next/link that navigates inside a View Transition: the old page
 * shrinks back and blurs while the new one rises up over it (keyframes
 * in brief.css). Modified clicks, same-page links, unsupported browsers
 * and reduced motion all get an ordinary navigation.
 */
export function TransitionLink({
  href,
  className,
  children,
  ...rest
}: {
  href: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const doc = document as ViewTransitionDoc;
    const samePage = href.split("#")[0] === pathname;
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      samePage ||
      !doc.startViewTransition ||
      reducedMotion()
    ) {
      return; // plain Link behaviour
    }
    e.preventDefault();
    doc.startViewTransition(
      () =>
        new Promise<void>((resolve) => {
          finishTransition = resolve;
          // never let a slow route hold the screen frozen
          setTimeout(resolve, 2500);
          router.push(href, { scroll: false });
        }),
    );
  };

  return (
    <Link href={href} className={className} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */

/**
 * A heading that rises out of its own line box — the mask clips it, so
 * the text appears to slide up from behind the baseline.
 */
export function MaskTitle({
  children,
  as = "h2",
  className = "",
  delay = 0,
  immediate = false,
}: {
  children: ReactNode;
  as?: "h1" | "h2" | "h3" | "span";
  className?: string;
  delay?: number;
  /** animate on mount instead of on scroll-into-view (above the fold) */
  immediate?: boolean;
}) {
  const Tag = motion[as];
  const trigger = immediate
    ? { animate: "shown" }
    : { whileInView: "shown", viewport: { once: true, margin: "-60px" } };
  return (
    <motion.span className="brief-mask" initial="hidden" {...trigger}>
      <Tag
        className={className}
        variants={{
          hidden: { y: "105%", rotate: 2 },
          shown: { y: "0%", rotate: 0 },
        }}
        transition={{ duration: 1.1, delay, ease: EASE.out }}
      >
        {children}
      </Tag>
    </motion.span>
  );
}

/**
 * A block that lifts and unclips from the top edge as it enters. The
 * clip is dropped when the animation ends so focus rings and shadows
 * are never cut off afterwards.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  immediate = false,
  as = "div",
  style,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  immediate?: boolean;
  /** render as a list item so it can sit directly inside <ol>/<ul> */
  as?: "div" | "li";
  style?: CSSProperties;
}) {
  const Tag = motion[as];
  const shown = {
    opacity: 1,
    y: 0,
    clipPath: "inset(0% 0% 0% 0% round 0px)",
    transitionEnd: { clipPath: "none" },
  };
  const trigger = immediate
    ? { animate: shown }
    : { whileInView: shown, viewport: { once: true, margin: "-80px" } };
  return (
    <Tag
      className={className}
      style={style}
      initial={{
        opacity: 0,
        y: 36,
        clipPath: "inset(18% 0% 0% 0% round 20px)",
      }}
      {...trigger}
      transition={{ duration: 1.1, delay, ease: EASE.out }}
    >
      {children}
    </Tag>
  );
}

/**
 * Scrubbed vertical drift tied to scroll position. `speed` is the total
 * travel in px across the element's pass through the viewport; negative
 * moves up. Desktop only — on touch screens it just sits still.
 */
export function Parallax({
  children,
  speed = -80,
  className,
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // matchMedia reverts everything it created when a query stops
    // matching, and on unmount via mm.revert()
    const mm = gsap.matchMedia();
    mm.add(
      "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
      () => {
        gsap.fromTo(
          el,
          { y: -speed / 2 },
          {
            y: speed / 2,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      },
    );
    return () => mm.revert();
  }, [speed]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** An endless horizontal ticker. Pure CSS; pauses on hover. */
export function Marquee({ items }: { items: readonly string[] }) {
  const row = (copy: number) =>
    items.map((s, i) => (
      <span key={`${copy}-${i}`} className="brief-marquee-item">
        {s}
      </span>
    ));
  return (
    <div className="brief-marquee" aria-hidden>
      <div className="brief-marquee-track">
        {row(0)}
        {row(1)}
      </div>
    </div>
  );
}
