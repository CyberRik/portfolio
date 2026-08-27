"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import type { ProjectDemo } from "@/content/work";
import { audioPlayer } from "@/lib/audioStore";
import { useOSDesktop } from "@/components/objects/MonitorScreen";
import { OS } from "./theme";

/**
 * A recorded walkthrough, played without ever costing the room a frame.
 *
 * The rule this file exists to enforce: **no <iframe> is mounted while
 * the 3D scene is on screen.** RM-OS is live DOM pinned to the monitor's
 * screen plane by drei's <Html transform>, so an embed there is legal —
 * but it is a video decode plus a compositing pass on a CSS-3D layer,
 * paid on a machine that may be on the weak GPU tier, and it would land
 * during the portal's camera dive when the budget is tightest.
 *
 * So the two modes are genuinely different components, not one
 * component with a size prop:
 *
 *   docked    — a poster frame and nothing else. One cached JPEG, zero
 *               scripts, zero decode. Every chapter is a plain link out
 *               to YouTube at that timestamp, so the seek points are
 *               still useful without a player existing.
 *
 *   popped out — the real thing, inline. PortalSuspend has already set
 *               frameloop:"never" (pop-out freezes immediately, before
 *               this can mount), so the canvas is drawing nothing and
 *               the player has the machine to itself.
 *
 * In both modes the player is lazy: the poster is a facade and the
 * iframe only exists after a deliberate click. Chapters re-key the
 * iframe rather than talking to it, which avoids pulling in the YouTube
 * iframe API — one <script> nobody needs for a seek.
 */

/** mm:ss for a chapter offset */
function stamp(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const watchUrl = (id: string, at = 0) =>
  `https://youtu.be/${id}${at > 0 ? `?t=${at}` : ""}`;

const embedUrl = (id: string, at: number) =>
  `https://www.youtube-nocookie.com/embed/${id}` +
  `?autoplay=1&start=${at}&rel=0&modestbranding=1&playsinline=1`;

export function DemoPlayer({ demo }: { demo: ProjectDemo }) {
  const { isPoppedOut } = useOSDesktop();
  /** seconds to start from; null = nothing mounted, poster only */
  const [startAt, setStartAt] = useState<number | null>(null);

  /**
   * Two sounds at once is nobody's idea of a demo. The room's music is
   * a real <audio> element in audioStore, so it can simply be paused —
   * and left paused, because silently resuming it under a video that
   * may still be running would be worse than the problem.
   */
  const play = useCallback((at: number) => {
    if (audioPlayer.state.playing) audioPlayer.togglePlay();
    setStartAt(at);
  }, []);

  return isPoppedOut ? (
    <PoppedOut demo={demo} startAt={startAt} onPlay={play} />
  ) : (
    <Docked demo={demo} />
  );
}

/* ------------------------------------------------------------------ */
/* popped out — the inline player                                      */

function PoppedOut({
  demo,
  startAt,
  onPlay,
}: {
  demo: ProjectDemo;
  startAt: number | null;
  onPlay: (at: number) => void;
}) {
  return (
    <div>
      <p className="text-[14.5px] leading-relaxed" style={{ color: OS.txt }}>
        {demo.blurb}
      </p>

      <div
        className="relative mt-4 w-full overflow-hidden rounded-lg"
        style={{ aspectRatio: "16 / 9", background: "#000", border: `1px solid ${OS.line}` }}
      >
        {startAt === null ? (
          <Facade demo={demo} onPlay={() => onPlay(0)} big />
        ) : (
          <iframe
            /* re-keying is the seek: a chapter click remounts the embed at
               its offset, which costs one navigation and saves loading the
               YouTube iframe API purely to call seekTo(). */
            key={startAt}
            src={embedUrl(demo.youtube, startAt)}
            title="Project demo"
            className="absolute inset-0 h-full w-full"
            style={{ border: 0 }}
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: OS.faint }}>
          Chapters
        </p>
        <a
          href={watchUrl(demo.youtube)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[11px] transition-colors hover:underline"
          style={{ color: OS.dim }}
        >
          Watch on YouTube ↗
        </a>
      </div>

      <ul className="mt-2 grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
        {demo.chapters.map((c) => {
          const active = startAt === c.at;
          return (
            <li key={c.at}>
              <button
                onClick={() => onPlay(c.at)}
                className="flex w-full items-baseline gap-3 rounded px-2 py-1.5 text-left transition-colors hover:bg-white/[0.06]"
                style={{ background: active ? "rgba(255,255,255,0.07)" : "transparent" }}
              >
                <span
                  className="shrink-0 font-mono text-[11.5px] tabular-nums"
                  style={{ color: active ? OS.accent : OS.faint }}
                >
                  {stamp(c.at)}
                </span>
                <span className="text-[13.5px] leading-snug" style={{ color: active ? OS.txt : OS.dim }}>
                  {c.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* docked — poster only, never an embed                                */

function Docked({ demo }: { demo: ProjectDemo }) {
  const jump = demo.highlight;
  return (
    <div>
      <p className="text-[10.5px] leading-relaxed" style={{ color: OS.txt }}>
        {demo.blurb}
      </p>

      <a
        href={watchUrl(demo.youtube)}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative mt-2 block w-full max-w-[420px] overflow-hidden rounded-md"
        style={{ aspectRatio: "16 / 9", background: "#000", border: `1px solid ${OS.line}` }}
      >
        <Facade demo={demo} />
      </a>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        {jump && (
          <a
            href={watchUrl(demo.youtube, jump.at)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[9px] transition-colors hover:underline"
            style={{ color: OS.accent }}
          >
            ▸ {stamp(jump.at)} — {jump.label} ↗
          </a>
        )}
        <span className="font-mono text-[9px]" style={{ color: OS.faint }}>
          Pop out for the inline player and chapter list
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * The poster: one image standing in for a player.
 *
 * Rendered as a <button> when it can start playback and as plain
 * content when its parent is already the link out — so the docked
 * version never nests an interactive element inside an anchor.
 */
function Facade({ demo, onPlay, big = false }: { demo: ProjectDemo; onPlay?: () => void; big?: boolean }) {
  const inner = (
    <>
      <Image
        src={demo.poster}
        alt=""
        fill
        /* the poster is never wider than the popped-out doc column, so
           there is no reason to ship a 4K variant of a screenshot */
        sizes="(max-width: 768px) 100vw, 900px"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
      />
      {/* the poster is a screenshot of dense UI — it needs a scrim under
          the play affordance or neither reads */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0.22), rgba(0,0,0,0.58))" }}
      />
      <span
        className={`absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 ${
          big ? "h-16 w-16" : "h-9 w-9"
        }`}
        style={{ background: "rgba(20,18,15,0.72)", border: `1px solid ${OS.accent}66` }}
      >
        <span
          className={big ? "text-[22px] leading-none" : "text-[13px] leading-none"}
          style={{ color: OS.accent, marginLeft: big ? 4 : 2 }}
        >
          ▶
        </span>
      </span>
      <span
        className={`absolute right-2 bottom-2 rounded font-mono tabular-nums ${
          big ? "px-2 py-0.5 text-[11px]" : "px-1.5 py-[1px] text-[8.5px]"
        }`}
        style={{ background: "rgba(0,0,0,0.66)", color: OS.txt }}
      >
        {demo.length}
      </span>
    </>
  );

  if (!onPlay) return inner;

  return (
    <button
      onClick={onPlay}
      aria-label={`Play the demo (${demo.length})`}
      className="group absolute inset-0 h-full w-full cursor-pointer"
    >
      {inner}
    </button>
  );
}
