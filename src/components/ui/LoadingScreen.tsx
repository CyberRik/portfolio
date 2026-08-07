"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useProgress } from "@react-three/drei";
import { useSceneReady } from "@/lib/sceneReady";
import { BOOT_FACTS } from "@/content/portfolio";

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
export function LoadingScreen() {
  const { progress } = useProgress();
  const ready = useSceneReady();

  return (
    <AnimatePresence>
      {!ready && (
        <motion.div
          key="loader"
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#16130f]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1.1, ease: "easeInOut" } }}
        >
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

          {/* The dossier. Fixed-height slot so the layout never reflows
              as lines swap — a shifting boot screen reads as broken. */}
          <div className="relative mt-10 h-10 w-[min(30rem,86vw)]">
            {BOOT_FACTS.map((f, i) => (
              <div
                key={f.k}
                className="boot-fact absolute inset-0 flex flex-col items-center justify-center gap-1.5 opacity-0"
                style={{ animationDelay: `${i * 3}s` }}
              >
                <span className="font-mono text-[9px] tracking-[0.3em] text-[#5c5344] uppercase">
                  {f.k}
                </span>
                <span className="text-center font-mono text-[13px] tracking-[0.08em] text-[#d9cdb4]">
                  {f.v}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
