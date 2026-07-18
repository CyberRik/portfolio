"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Html } from "@react-three/drei";
import { PROJECTS } from "@/content/portfolio";
import { closePortal, usePortalSection } from "@/lib/portal";

/**
 * PROJECTS — RM-OS, rendered ON the monitor's physical panel.
 *
 * Not a fullscreen takeover: live DOM pinned to the screen plane with
 * drei's transform mode, so the camera simply sits you down in front
 * of the machine — desk, lamp glow and room edges stay in your
 * peripheral vision while you mouse over a real desktop. Icons are
 * visible the instant the panel wakes; one click opens a project.
 *
 * Geometry: the shader screen plane is 1.44 × 0.56 world units; in
 * transform mode worldSize = cssPx × distanceFactor / 400, so a
 * 1152×448 css surface at distanceFactor 0.5 maps onto it exactly.
 */
const CSS_W = 1152;
const CSS_H = 448;

const APP_ACCENTS = ["#7fb4ff", "#ff8f7a", "#8be0c8", "#d8b4ff"];

export function MonitorScreen() {
  const active = usePortalSection() === "projects";

  if (!active) return null;
  return (
    <Html
      transform
      distanceFactor={0.5}
      position={[0, 0, 0.026]}
      zIndexRange={[35, 0]}
      style={{ width: CSS_W, height: CSS_H }}
    >
      <Desktop />
    </Html>
  );
}

function Desktop() {
  const [awake, setAwake] = useState(false);
  const [app, setApp] = useState<number | null>(null);
  const clock = useMemo(
    () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    [],
  );

  // brief power-on beat while the camera is still settling in
  useEffect(() => {
    const t = setTimeout(() => setAwake(true), 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      className="relative overflow-hidden bg-black"
      style={{ width: CSS_W, height: CSS_H }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <AnimatePresence>
        {awake && (
          <motion.div
            key="desktop"
            className="absolute inset-0 flex flex-col"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 0%, #101a2e 0%, #0a1120 55%, #060a14 100%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            {/* menu bar */}
            <div className="flex items-center justify-between border-b border-white/6 bg-white/3 px-4 py-1.5 font-mono text-[10px] text-[#8ba3c7]">
              <div className="flex items-center gap-4">
                <span className="font-semibold tracking-[0.2em] text-[#dce7f7]">RM-OS</span>
                <span>Projects</span>
              </div>
              <div className="flex items-center gap-4">
                <span>{clock}</span>
                <button
                  onClick={closePortal}
                  className="rounded px-1.5 py-0.5 tracking-[0.15em] uppercase transition-colors hover:bg-white/10 hover:text-[#dce7f7]"
                >
                  ⏻ shut down
                </button>
              </div>
            </div>

            <div className="relative flex-1">
              {/* desktop icons — all projects visible instantly */}
              <div className="absolute top-3 left-3 flex flex-col gap-2.5">
                {PROJECTS.map((p, i) => (
                  <motion.button
                    key={p.title}
                    onClick={() => setApp(app === i ? null : i)}
                    className="group flex w-[92px] flex-col items-center gap-1 rounded-md p-1.5 transition-colors hover:bg-white/6"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl font-mono text-[13px] font-semibold text-black/80 shadow-md transition-transform group-hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${APP_ACCENTS[i % APP_ACCENTS.length]}, ${APP_ACCENTS[i % APP_ACCENTS.length]}88)`,
                        outline: app === i ? `2px solid ${APP_ACCENTS[i % APP_ACCENTS.length]}66` : "none",
                        outlineOffset: 2,
                      }}
                    >
                      {p.title.replace(/[^A-Za-z]/g, "").slice(0, 2)}
                    </span>
                    <span className="max-w-full text-center font-mono text-[9px] leading-tight break-words text-[#c6d4ea]">
                      {p.title}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* wallpaper idle state */}
              {app === null && (
                <motion.div
                  className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center select-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <p className="font-mono text-[44px] font-light tracking-tight text-[#dce7f7]/85">
                    {clock}
                  </p>
                  <p className="mt-1 font-mono text-[9px] tracking-[0.4em] text-[#5f7ea6] uppercase">
                    open a project
                  </p>
                </motion.div>
              )}

              {/* app window */}
              <AnimatePresence mode="popLayout">
                {app !== null && (
                  <motion.section
                    key={app}
                    className="absolute top-3 right-4 bottom-3 left-32 flex flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0d1524]/97 shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
                    initial={{ opacity: 0, y: 22, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 14, scale: 0.96 }}
                    transition={{ duration: 0.22, ease: [0.2, 0.9, 0.25, 1] }}
                  >
                    <div className="flex items-center gap-1.5 border-b border-white/6 px-3 py-1.5">
                      <button
                        onClick={() => setApp(null)}
                        aria-label="Close window"
                        className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] transition-transform hover:scale-110"
                      />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
                      <span className="ml-2 font-mono text-[10px] text-[#8ba3c7]">
                        {PROJECTS[app].title}.app
                      </span>
                      <span className="ml-auto font-mono text-[9px] text-[#50658a]">
                        {PROJECTS[app].period}
                      </span>
                    </div>
                    <div className="overflow-y-auto px-4 py-3">
                      <p
                        className="font-mono text-[9px] tracking-[0.2em] uppercase"
                        style={{ color: APP_ACCENTS[app % APP_ACCENTS.length] }}
                      >
                        {PROJECTS[app].role}
                      </p>
                      {PROJECTS[app].context && (
                        <p className="mt-1 text-[11px] text-[#a7b8d4] italic">
                          {PROJECTS[app].context}
                        </p>
                      )}
                      <ul className="mt-2.5 space-y-1.5">
                        {PROJECTS[app].bullets.map((b, i) => (
                          <motion.li
                            key={b}
                            className="flex gap-2 text-[11px] leading-relaxed text-[#c6d4ea]"
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.06 + i * 0.04, duration: 0.2 }}
                          >
                            <span
                              className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full"
                              style={{ background: APP_ACCENTS[app % APP_ACCENTS.length] }}
                            />
                            <span>{b}</span>
                          </motion.li>
                        ))}
                      </ul>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {PROJECTS[app].tags.map((t) => (
                          <span
                            key={t}
                            className="rounded border border-white/8 bg-white/4 px-1.5 py-0.5 font-mono text-[9px] text-[#8ba3c7]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
