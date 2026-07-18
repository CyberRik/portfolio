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
          <motion.p
            className="mt-4 font-mono text-[10px] tracking-[0.25em] text-[#5c5344]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.4 } }}
          >
            {progress < 100 ? `${Math.round(progress)}%` : "compiling shaders"}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
