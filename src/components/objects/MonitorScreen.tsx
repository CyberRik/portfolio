"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Html } from "@react-three/drei";
import { PROFILE, PROJECTS } from "@/content/portfolio";
import { closePortal, usePortalSection } from "@/lib/portal";
import { DUR, EASE } from "@/lib/design";

/**
 * PROJECTS — RM-OS, rendered ON the monitor's physical panel.
 *
 * Not a fullscreen takeover: live DOM pinned to the screen plane with
 * drei's transform mode, so the camera simply sits you down in front
 * of the machine — desk, lamp glow and room edges stay in your
 * peripheral vision while you mouse over a real desktop. Icons are
 * visible the instant the panel wakes; one click opens a project.
 *
 * OS furniture that earns its place: a live clock (the machine is on),
 * a dock holding the four apps + the résumé (always one click away),
 * and a single welcome notification that says who this desk belongs to.
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

/** ticks once a second — the OS is alive even when you do nothing */
function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function Desktop() {
  const [awake, setAwake] = useState(false);
  const [app, setApp] = useState<number | null>(null);
  const [toast, setToast] = useState(false);
  const now = useClock();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");

  // brief power-on beat while the camera is still settling in, then a
  // single welcome notification — dismissed by click or on its own
  useEffect(() => {
    const wake = setTimeout(() => setAwake(true), 700);
    const hello = setTimeout(() => setToast(true), 1800);
    const bye = setTimeout(() => setToast(false), 8200);
    return () => [wake, hello, bye].forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="relative overflow-hidden bg-black"
      style={{ width: CSS_W, height: CSS_H }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DUR.ui, ease: EASE.inOut }}
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
            transition={{ duration: DUR.ui, ease: EASE.out }}
          >
            {/* menu bar */}
            <div className="flex items-center justify-between border-b border-white/6 bg-white/3 px-4 py-1.5 font-mono text-[10px] text-[#8ba3c7]">
              <div className="flex items-center gap-4">
                <span className="font-semibold tracking-[0.2em] text-[#dce7f7]">RM-OS</span>
                <span>Projects</span>
              </div>
              <div className="flex items-center gap-4">
                <span>
                  {hh}
                  <span className="cursor-blink">:</span>
                  {mm}
                </span>
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
                    transition={{ delay: 0.08 + i * 0.05, duration: DUR.ui, ease: EASE.out }}
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

              {/* wallpaper idle state — live clock, blinking colon */}
              {app === null && (
                <motion.div
                  className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center select-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: DUR.move, ease: EASE.out }}
                >
                  <p className="font-mono text-[44px] font-light tracking-tight text-[#dce7f7]/85 tabular-nums">
                    {hh}
                    <span className="cursor-blink">:</span>
                    {mm}
                  </p>
                  <p className="mt-1 font-mono text-[9px] tracking-[0.4em] text-[#5f7ea6] uppercase">
                    open a project
                  </p>
                </motion.div>
              )}

              {/* welcome notification — who this desk belongs to */}
              <AnimatePresence>
                {toast && (
                  <motion.button
                    key="toast"
                    onClick={() => setToast(false)}
                    className="absolute top-3 right-4 w-[270px] rounded-lg border border-white/10 bg-[#101827]/95 px-3.5 py-2.5 text-left shadow-[0_14px_36px_rgba(0,0,0,0.5)] backdrop-blur-sm"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16, transition: { duration: DUR.tap, ease: EASE.in } }}
                    transition={{ duration: DUR.ui, ease: EASE.out }}
                  >
                    <p className="font-mono text-[9px] tracking-[0.2em] text-[#5f7ea6] uppercase">
                      RM-OS · welcome
                    </p>
                    <p className="mt-1 text-[11px] leading-snug text-[#c6d4ea]">
                      Hi — I&apos;m Ritankar. Four shipped projects on this desktop; the
                      résumé lives in the dock.
                    </p>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* app window */}
              <AnimatePresence mode="popLayout">
                {app !== null && (
                  <motion.section
                    key={app}
                    className="absolute top-3 right-4 bottom-13 left-32 flex flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0d1524]/97 shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
                    initial={{ opacity: 0, y: 22, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 14, scale: 0.96 }}
                    transition={{ duration: DUR.tap, ease: EASE.out }}
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
                            transition={{ delay: 0.06 + i * 0.04, duration: DUR.tap, ease: EASE.out }}
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

              {/* dock — the four apps + the résumé, always one click away */}
              <motion.div
                className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 items-end gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-md"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: DUR.ui, ease: EASE.out }}
              >
                {PROJECTS.map((p, i) => (
                  <button
                    key={p.title}
                    onClick={() => setApp(app === i ? null : i)}
                    className="group relative flex flex-col items-center"
                  >
                    <span className="pointer-events-none absolute -top-6 rounded border border-white/10 bg-black/80 px-1.5 py-0.5 font-mono text-[8px] whitespace-nowrap text-[#c6d4ea] opacity-0 transition-opacity group-hover:opacity-100">
                      {p.title}
                    </span>
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg font-mono text-[10px] font-semibold text-black/80 transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${APP_ACCENTS[i % APP_ACCENTS.length]}, ${APP_ACCENTS[i % APP_ACCENTS.length]}88)`,
                      }}
                    >
                      {p.title.replace(/[^A-Za-z]/g, "").slice(0, 2)}
                    </span>
                    {/* running indicator */}
                    <span
                      className="mt-0.5 h-[3px] w-[3px] rounded-full transition-opacity"
                      style={{
                        background: APP_ACCENTS[i % APP_ACCENTS.length],
                        opacity: app === i ? 1 : 0,
                      }}
                    />
                  </button>
                ))}
                <div className="mx-0.5 mb-1 h-6 w-px bg-white/10" />
                <a
                  href={PROFILE.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex flex-col items-center"
                >
                  <span className="pointer-events-none absolute -top-6 rounded border border-white/10 bg-black/80 px-1.5 py-0.5 font-mono text-[8px] whitespace-nowrap text-[#c6d4ea] opacity-0 transition-opacity group-hover:opacity-100">
                    Résumé.pdf
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#f0ead8] to-[#c9c2b0] font-mono text-[9px] font-semibold text-[#4a4335] transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-110">
                    CV
                  </span>
                  <span className="mt-0.5 h-[3px] w-[3px]" />
                </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
