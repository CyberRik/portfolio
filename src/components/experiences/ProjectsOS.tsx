"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PROJECTS } from "@/content/portfolio";
import type { PortalProps } from "./ExperienceOverlay";

/**
 * PROJECTS — the monitor wakes straight to a desktop.
 *
 * Identity: a premium dark operating system — but zero ceremony. No
 * boot log: the screen powers on and every project is already there as
 * a labeled desktop icon. One click opens it as an application window.
 * Time-to-content is the design constraint (an interviewer should see
 * all four projects within a second of the screen waking).
 */

/** per-app accent — each application feels like its own product */
const APP_ACCENTS = ["#7fb4ff", "#ff8f7a", "#8be0c8", "#d8b4ff"];

export function ProjectsOS({ onClose }: PortalProps) {
  const [awake, setAwake] = useState(false);
  const [app, setApp] = useState<number | null>(null);
  const clock = useMemo(
    () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    [],
  );

  // brief power-on beat while the camera is still diving — then desktop
  useEffect(() => {
    const t = setTimeout(() => setAwake(true), 550);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.9, ease: "easeInOut" }}
      exit={{ opacity: 0, transition: { duration: 0.45, ease: "easeIn" } }}
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
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* menu bar */}
            <div className="flex items-center justify-between border-b border-white/6 bg-white/3 px-5 py-2 font-mono text-[11px] text-[#8ba3c7] backdrop-blur-sm">
              <div className="flex items-center gap-5">
                <span className="font-semibold tracking-[0.2em] text-[#dce7f7]">RM-OS</span>
                <span>Projects</span>
              </div>
              <div className="flex items-center gap-5">
                <span>{clock}</span>
                <button
                  onClick={onClose}
                  className="rounded px-2 py-0.5 tracking-[0.15em] uppercase transition-colors hover:bg-white/10 hover:text-[#dce7f7]"
                >
                  ⏻ shut down
                </button>
              </div>
            </div>

            <div className="relative flex-1">
              {/* desktop icons — every project visible immediately */}
              <div className="absolute top-6 left-6 flex flex-col gap-5">
                {PROJECTS.map((p, i) => (
                  <motion.button
                    key={p.title}
                    onClick={() => setApp(app === i ? null : i)}
                    className="group flex w-[104px] flex-col items-center gap-2 rounded-lg p-2 transition-colors hover:bg-white/6"
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <span
                      className="flex h-14 w-14 items-center justify-center rounded-2xl font-mono text-lg font-semibold text-black/80 shadow-lg transition-transform group-hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${APP_ACCENTS[i % APP_ACCENTS.length]}, ${APP_ACCENTS[i % APP_ACCENTS.length]}88)`,
                        outline: app === i ? `2px solid ${APP_ACCENTS[i % APP_ACCENTS.length]}66` : "none",
                        outlineOffset: 3,
                      }}
                    >
                      {p.title.replace(/[^A-Za-z]/g, "").slice(0, 2)}
                    </span>
                    <span className="max-w-full text-center font-mono text-[11px] leading-tight break-words text-[#c6d4ea]">
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
                  transition={{ delay: 0.25, duration: 0.7 }}
                >
                  <p className="font-mono text-[64px] font-light tracking-tight text-[#dce7f7]/85">
                    {clock}
                  </p>
                  <p className="mt-2 font-mono text-[11px] tracking-[0.4em] text-[#5f7ea6] uppercase">
                    open a project
                  </p>
                </motion.div>
              )}

              {/* app window */}
              <AnimatePresence mode="popLayout">
                {app !== null && (
                  <motion.section
                    key={app}
                    className="absolute inset-x-0 top-8 mx-auto flex max-h-[calc(100%-5rem)] w-[min(640px,80vw)] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0d1524]/95 shadow-[0_40px_80px_rgba(0,0,0,0.55)] lg:left-44"
                    initial={{ opacity: 0, y: 40, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 26, scale: 0.94 }}
                    transition={{ duration: 0.26, ease: [0.2, 0.9, 0.25, 1] }}
                  >
                    <div className="flex items-center gap-2 border-b border-white/6 px-4 py-2.5">
                      <button
                        onClick={() => setApp(null)}
                        aria-label="Close window"
                        className="h-3 w-3 rounded-full bg-[#ff5f57] transition-transform hover:scale-110"
                      />
                      <span className="h-3 w-3 rounded-full bg-white/12" />
                      <span className="h-3 w-3 rounded-full bg-white/12" />
                      <span className="ml-3 font-mono text-[11px] text-[#8ba3c7]">
                        {PROJECTS[app].title}.app
                      </span>
                      <span className="ml-auto font-mono text-[10px] text-[#50658a]">
                        {PROJECTS[app].period}
                      </span>
                    </div>
                    <div className="overflow-y-auto px-6 py-5">
                      <p
                        className="font-mono text-[11px] tracking-[0.2em] uppercase"
                        style={{ color: APP_ACCENTS[app % APP_ACCENTS.length] }}
                      >
                        {PROJECTS[app].role}
                      </p>
                      {PROJECTS[app].context && (
                        <p className="mt-1.5 text-[13px] text-[#a7b8d4] italic">
                          {PROJECTS[app].context}
                        </p>
                      )}
                      <ul className="mt-4 space-y-2.5">
                        {PROJECTS[app].bullets.map((b, i) => (
                          <motion.li
                            key={b}
                            className="flex gap-3 text-[13px] leading-relaxed text-[#c6d4ea]"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.08 + i * 0.05, duration: 0.25 }}
                          >
                            <span
                              className="mt-[8px] h-[3px] w-[3px] shrink-0 rounded-full"
                              style={{ background: APP_ACCENTS[app % APP_ACCENTS.length] }}
                            />
                            <span>{b}</span>
                          </motion.li>
                        ))}
                      </ul>
                      <div className="mt-5 flex flex-wrap gap-1.5">
                        {PROJECTS[app].tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-md border border-white/8 bg-white/4 px-2 py-0.5 font-mono text-[10px] text-[#8ba3c7]"
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
