"use client";

/**
 * The brief's toy: a pendant lamp hanging under the nav.
 *
 * The lamp is the same fixture that hangs over the desk in the room. It
 * swings on a damped spring: drag it and let go, and it settles the way
 * a real pendant does. A tap pulls the switch — it doesn't change the
 * theme (the page stays black); it throws a warm cone of light down the
 * page, which swings with the shade.
 *
 * "Is the lamp on" lives in a tiny external store, so anything else on
 * the page can react to the light later without threading props.
 */

import { useEffect, useRef, useSyncExternalStore } from "react";

/* ------------------------------------------------------------ store */

let lampOn = false;
const listeners = new Set<() => void>();
const setLamp = (on: boolean) => {
  lampOn = on;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
const useLampOn = () =>
  useSyncExternalStore(
    subscribe,
    () => lampOn,
    () => false,
  );

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------- lamp */

/** spring stiffness and per-frame damping of the swing */
const K = 0.02;
const DAMP = 0.97;
const MAX_ANGLE = 55;

export function PendantLamp() {
  const on = useLampOn();
  const rig = useRef<HTMLDivElement>(null);
  const sim = useRef({ a: 0, v: 0, raf: 0, drag: false, moved: 0, x0: 0 });

  const step = () => {
    const s = sim.current;
    if (!s.drag) {
      s.v = (s.v - K * s.a) * DAMP;
      s.a += s.v;
    }
    if (rig.current) rig.current.style.transform = `rotate(${s.a}deg)`;
    const moving = s.drag || Math.abs(s.v) > 0.01 || Math.abs(s.a) > 0.05;
    s.raf = moving ? requestAnimationFrame(step) : 0;
  };

  const kick = (dv: number) => {
    if (reducedMotion()) return;
    sim.current.v += dv;
    if (!sim.current.raf) sim.current.raf = requestAnimationFrame(step);
  };

  useEffect(() => {
    const s = sim.current;
    // a small swing on arrival, so it reads as something you can touch
    const t = setTimeout(() => kick(3), 900);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(s.raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const s = sim.current;
    s.drag = true;
    s.moved = 0;
    s.x0 = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
    kick(0);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const s = sim.current;
    if (!s.drag || !rig.current || reducedMotion()) return;
    // angle of the pointer around the pivot (the rig's top centre);
    // the rect is axis-aligned so its centre stays on the pivot line
    const r = rig.current.getBoundingClientRect();
    const px = r.left + r.width / 2;
    const deg =
      (-Math.atan2(e.clientX - px, Math.max(e.clientY - r.top, 24)) * 180) /
      Math.PI;
    const a = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, deg));
    s.v = a - s.a; // release carries the throw
    s.a = a;
    s.moved = Math.max(s.moved, Math.abs(e.clientX - s.x0));
  };

  const onPointerUp = () => {
    sim.current.drag = false;
  };

  const onClick = () => {
    // a drag that moved is a swing, not a pull
    if (sim.current.moved > 6) return;
    setLamp(!on);
    kick(on ? -4 : 4); // the tug sets it rocking
  };

  return (
    <div className="brief-lamp" data-on={on}>
      <div ref={rig} className="brief-lamp-rig">
        <span className="brief-lamp-cord" />
        <button
          type="button"
          aria-label={on ? "Switch the lamp off" : "Switch the lamp on"}
          aria-pressed={on}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={onClick}
        >
          <svg viewBox="0 0 64 44" width="52" height="36" aria-hidden>
            {/* canopy collar */}
            <rect className="brief-lamp-collar" x="27" y="0" width="10" height="7" rx="1.5" />
            {/* spun-aluminium dome, open at the bottom */}
            <path
              className="brief-lamp-shade"
              d="M27 7 C27 7 24 9 22 12 C12 15 5 24 3 34 L61 34 C59 24 52 15 42 12 C40 9 37 7 37 7 Z"
            />
            {/* the bulb face, seen from just below the rim */}
            <ellipse className="brief-lamp-bulb" cx="32" cy="35" rx="18" ry="4.5" />
          </svg>
        </button>
        {/* the light itself: rotates with the rig, so the pool swings */}
        <span className="brief-lamp-beam" aria-hidden />
      </div>
    </div>
  );
}
