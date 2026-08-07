"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useProgress } from "@react-three/drei";
import { useSceneReady } from "@/lib/sceneReady";
import { BOOT_NOTES } from "@/content/portfolio";

/**
 * Boot screen. Holds until BOTH conditions are true:
 *  1. every asset has downloaded (useProgress)
 *  2. the scene has rendered a run of warm frames (shader compile +
 *     shadow bake done) — signalled by ReadyProbe via sceneReady
 * So the user never sees the world assembling itself.
 *
 * WHY THERE IS SOMETHING TO READ HERE
 *
 * This screen is up for several seconds on a first visit — 4MB of models
 * and a Draco decoder have to land before the room can exist — and a
 * spinner gives a visitor no reason to spend those seconds rather than
 * close the tab. So the wait carries the pitch: a rotating dossier of
 * real, attributable numbers (BOOT_FACTS), which is the one thing a
 * portfolio can put in dead time that is worth more than a progress bar.
 *
 * It costs nothing to load. No images, no fonts beyond the two already
 * in the shell, no library — text and CSS keyframes only. Anything this
 * screen fetched would be another thing the room waits behind, which is
 * the opposite of the point.
 *
 * Every animation here is CSS. The heavy part of the wait is shader
 * compilation and the first shadow bake, both of which block the main
 * thread — a JS-driven ticker freezes exactly when the screen most needs
 * to look alive. The framer-motion usage is confined to mount/exit
 * transitions, which run before and after that window, never during it.
 */
/**
 * Star field for the backdrop — a fixed table, deliberately not random.
 *
 * This component re-renders on every `useProgress` tick, so `Math.random()`
 * here would deal a new sky several times a second and the stars would
 * visibly crawl. Hand-placed, upper sky only (the panorama shader masks
 * stars near the horizon; matching that keeps the handoff consistent).
 */
const BOOT_STARS = [
  { x: 8, y: 12, r: 2, o: 0.5, d: 0 },
  { x: 19, y: 26, r: 1, o: 0.35, d: 1.4 },
  { x: 27, y: 7, r: 1, o: 0.45, d: 2.9 },
  { x: 36, y: 19, r: 2, o: 0.6, d: 0.7 },
  { x: 44, y: 31, r: 1, o: 0.3, d: 3.6 },
  { x: 53, y: 9, r: 1, o: 0.4, d: 2.1 },
  { x: 61, y: 23, r: 2, o: 0.55, d: 4.3 },
  { x: 69, y: 14, r: 1, o: 0.35, d: 1.1 },
  { x: 77, y: 29, r: 1, o: 0.45, d: 3.2 },
  { x: 84, y: 6, r: 2, o: 0.5, d: 0.4 },
  { x: 91, y: 21, r: 1, o: 0.4, d: 2.6 },
  { x: 14, y: 36, r: 1, o: 0.28, d: 4.8 },
  { x: 48, y: 40, r: 1, o: 0.26, d: 1.9 },
  { x: 73, y: 38, r: 1, o: 0.3, d: 3.9 },
] as const;

export function LoadingScreen() {
  const { progress } = useProgress();
  const ready = useSceneReady();

  return (
    <AnimatePresence>
      {!ready && (
        <motion.div
          key="loader"
          className="boot-sky absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1.1, ease: "easeInOut" } }}
        >
          {/* --- backdrop: the room's dusk city, in CSS. Inert and
              behind everything; the content below sits on z-10. --- */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {/* stars, upper sky only — same restraint as the panorama
                shader, which masks them out near the horizon */}
            {BOOT_STARS.map((s, i) => (
              <span
                key={i}
                className="star-twinkle absolute rounded-full bg-[#e8f0ff]"
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  width: s.r,
                  height: s.r,
                  opacity: s.o,
                  animationDelay: `${s.d}s`,
                }}
              />
            ))}
            {/* Skyline. Inline SVG so building heights actually vary —
                `preserveAspectRatio="none"` lets one authored path
                stretch to any viewport without a media query. Two paths
                at different fills read as depth. */}
            <svg
              className="absolute inset-x-0 bottom-0 h-[22%] w-full"
              viewBox="0 0 1200 200"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M0,200 L0,140 L40,140 L40,110 L90,110 L90,150 L140,150 L140,95 L200,95 L200,130 L250,130 L250,105 L310,105 L310,145 L360,145 L360,120 L420,120 L420,90 L470,90 L470,135 L530,135 L530,115 L580,115 L580,150 L640,150 L640,100 L700,100 L700,140 L760,140 L760,118 L820,118 L820,88 L870,88 L870,132 L930,132 L930,112 L990,112 L990,148 L1050,148 L1050,105 L1110,105 L1110,138 L1160,138 L1160,120 L1200,120 L1200,200 Z"
                fill="#100b12"
              />
              <path
                d="M0,200 L0,120 L60,120 L60,70 L120,70 L120,110 L170,110 L170,60 L240,60 L240,100 L300,100 L300,75 L360,75 L360,125 L430,125 L430,85 L490,85 L490,55 L550,55 L550,105 L620,105 L620,80 L680,80 L680,130 L740,130 L740,65 L800,65 L800,110 L870,110 L870,90 L930,90 L930,50 L990,50 L990,115 L1060,115 L1060,78 L1130,78 L1130,120 L1200,120 L1200,200 Z"
                fill="#070509"
              />
              {/* a few lit windows — the detail that stops it reading as
                  a cardboard cutout. Sparse on purpose. */}
              <g fill="#ffb361" opacity="0.5">
                <rect x="186" y="106" width="4" height="6" />
                <rect x="205" y="140" width="4" height="6" />
                <rect x="500" y="66" width="4" height="6" />
                <rect x="524" y="88" width="4" height="6" />
                <rect x="700" y="92" width="4" height="6" />
                <rect x="944" y="62" width="4" height="6" />
                <rect x="968" y="84" width="4" height="6" />
                <rect x="1074" y="90" width="4" height="6" />
              </g>
            </svg>
            {/* Behind glass, so the view sits under a scrim — but a light
                one. The first pass used 45% plus a heavy vignette and
                crushed the warm horizon the sky exists for. */}
            <div className="absolute inset-0 bg-[#0a0809]/25" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_26%,rgba(8,6,7,0.6)_86%)]" />
          </div>
          {/* All foreground content in one stacking layer above the
              backdrop. Necessary, not decorative: the backdrop is
              absolutely positioned, and positioned elements paint above
              static in-flow siblings regardless of DOM order — without
              this wrapper the sky would cover the progress bar. */}
          <div className="relative z-10 flex flex-col items-center">
          {/* Orbital Spinner (CSS animated to avoid JS freezes during shader compilation) */}
          <div className="relative mb-12 flex h-24 w-24 items-center justify-center">
            <div
              className="absolute inset-0 animate-spin rounded-full border-y border-[#ffb361]/10"
              style={{ animationDuration: "3s" }}
            />
            <div
              className="absolute inset-2 animate-spin rounded-full border-x border-[#ffb361]/30"
              style={{ animationDuration: "2s", animationDirection: "reverse" }}
            />
            <div
              className="absolute inset-4 animate-spin rounded-full border-y border-[#ffb361]/50"
              style={{ animationDuration: "1.5s" }}
            />
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ffb361] shadow-[0_0_12px_#ffb361]" />
          </div>

          <motion.p
            className="mb-6 font-mono text-xs tracking-[0.4em] text-[#a89880] uppercase"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
          >
            Initializing workspace
          </motion.p>
          
          <div className="h-px w-48 overflow-hidden bg-[#3a352d]">
            <motion.div
              className="h-full bg-[#ffb361]"
              animate={{ width: `${Math.max(progress, 4)}%` }}
              transition={{ ease: "easeOut", duration: 0.3 }}
            />
          </div>

          <div className="relative mt-4 h-6 w-64 overflow-hidden">
            {progress < 100 ? (
              <motion.p
                className="absolute inset-0 flex items-center justify-center font-mono text-[10px] tracking-[0.25em] text-[#5c5344]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.4 } }}
              >
                {Math.round(progress)}% — STREAMING THE ROOM
              </motion.p>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] tracking-[0.25em] text-[#ffb361]">
                {/* CSS animated texts that cycle continuously without JS.
                    These name what is ACTUALLY happening between the last
                    byte landing and the first warm frame — this used to
                    claim "WAKING UP PHYSICS", which stopped being true
                    when the Rapier world was removed. A loading screen
                    that narrates work the app no longer does is the one
                    kind of filler worth avoiding here. */}
                <span className="loading-text-cycle absolute inset-0 flex items-center justify-center opacity-0" style={{ animationDelay: "0s" }}>
                  COMPILING SHADERS
                </span>
                <span className="loading-text-cycle absolute inset-0 flex items-center justify-center opacity-0" style={{ animationDelay: "2s" }}>
                  UPLOADING TEXTURES
                </span>
                <span className="loading-text-cycle absolute inset-0 flex items-center justify-center opacity-0" style={{ animationDelay: "4s" }}>
                  BAKING SHADOWS
                </span>
                <span className="loading-text-cycle absolute inset-0 flex items-center justify-center opacity-0" style={{ animationDelay: "6s" }}>
                  WARMING FRAMES
                </span>
              </div>
            )}
          </div>

          {/* Field notes. Fixed-height slot so the layout never reflows
              as lines swap — a shifting boot screen reads as broken, and
              these lines wrap to two rows at narrow widths. */}
          <div className="relative mt-12 h-20 w-[min(34rem,88vw)]">
            {BOOT_NOTES.map((note, i) => (
              <div
                key={note}
                className="boot-fact absolute inset-0 flex flex-col items-center justify-center gap-2.5 opacity-0"
                style={{ animationDelay: `${i * 4}s` }}
              >
                <span className="font-mono text-[8px] tracking-[0.34em] text-[#5c5344] uppercase">
                  field notes
                </span>
                <p className="text-center text-[14px] leading-snug text-balance text-[#d9cdb4]/90 italic">
                  {note}
                </p>
              </div>
            ))}
          </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
