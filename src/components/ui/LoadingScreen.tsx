"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useProgress } from "@react-three/drei";
import { useSceneReady } from "@/lib/sceneReady";

/**
 * Boot screen. Holds until BOTH conditions are true:
 *  1. every asset has downloaded (useProgress)
 *  2. the scene has rendered a run of warm frames (shader compile +
 *     shadow bake done) — signalled by ReadyProbe via sceneReady
 * So the user never sees the world assembling itself.
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
                {Math.round(progress)}% — DOWNLOADING ASSETS
              </motion.p>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] tracking-[0.25em] text-[#ffb361]">
                {/* CSS animated texts that cycle continuously without JS */}
                <span className="loading-text-cycle absolute inset-0 flex items-center justify-center opacity-0" style={{ animationDelay: "0s" }}>
                  COMPILING SHADERS
                </span>
                <span className="loading-text-cycle absolute inset-0 flex items-center justify-center opacity-0" style={{ animationDelay: "2s" }}>
                  BAKING ENVIRONMENT
                </span>
                <span className="loading-text-cycle absolute inset-0 flex items-center justify-center opacity-0" style={{ animationDelay: "4s" }}>
                  WAKING UP PHYSICS
                </span>
                <span className="loading-text-cycle absolute inset-0 flex items-center justify-center opacity-0" style={{ animationDelay: "6s" }}>
                  MOUNTING COMPONENTS
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
