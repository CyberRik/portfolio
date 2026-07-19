"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { Html } from "@react-three/drei";
import { PROFILE, PROJECTS } from "@/content/portfolio";
import { closePortal, usePortalSection } from "@/lib/portal";
import { DUR, EASE } from "@/lib/design";
import { audioPlayer, useAudioPlayer, TRACKS } from "@/lib/audioStore";

/**
 * PROJECTS — RM-OS, rendered ON the monitor's physical panel.
 *
 * Not a fullscreen takeover: live DOM pinned to the screen plane with
 * drei's transform mode, so the camera simply sits you down in front
 * of the machine — desk, lamp glow and room edges stay in your
 * peripheral vision while you mouse over a real desktop. Icons are
 * visible the instant the panel wakes; one click opens a project.
 *
 * Palette: the screen is a light source IN a warm room, so it can't be
 * cold. Neutral graphite (not navy) with the room's amber as the only
 * accent — the lamp reflecting off the panel. Chrome is mono, content
 * is sans: the macOS split, and what keeps a dense window readable at
 * this size.
 *
 * Geometry: the shader screen plane is 1.44 × 0.56 world units; in
 * transform mode worldSize = cssPx × distanceFactor / 400, so a
 * 1152×448 css surface at distanceFactor 0.5 maps onto it exactly.
 */
const CSS_W = 1152;
const CSS_H = 448;

/** graphite UI + the room's lamp amber; app tints stay in the warm half */
const OS = {
  txt: "#ece7dd",
  dim: "#948d80",
  faint: "#6b6459",
  accent: "#ffb361",
};

const APP_TINTS = ["#ffb361", "#e08b6a", "#a8b48c", "#c49ab0"];

/** macOS-style dock icons — all four are functional mini-apps */
const MACOS_DOCK: { id: string; label: string; glyph: string; bg: string }[] = [
  { id: "terminal", label: "Terminal", glyph: "▸_", bg: "linear-gradient(160deg, #1d1d1f, #3a3a3c)" },
  { id: "keyboard", label: "Keyboard", glyph: "⌨", bg: "linear-gradient(160deg, #5e5e63, #3a3a3c)" },
  { id: "notes", label: "Notes", glyph: "✎", bg: "linear-gradient(160deg, #f9e787, #f5d45a)" },
  { id: "music", label: "Music", glyph: "♫", bg: "linear-gradient(160deg, #fa5d6a, #d1344a)" },
];

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
  const [selectedIcons, setSelectedIcons] = useState<Set<number>>(new Set());
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [toast, setToast] = useState(false);
  const [openApps, setOpenApps] = useState<Set<string>>(() => new Set(["terminal"]));
  const toggleApp = useCallback((id: string) => {
    setOpenApps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);
  const closeApp = useCallback((id: string) => {
    setOpenApps((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);
  const now = useClock();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const day = now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

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
      // os-surface swaps the room's cursor for RM-OS's own for as long
      // as the pointer is on the glass (see globals.css)
      className="os-surface relative overflow-hidden bg-black"
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
              // graphite desktop, warmed from the top-left the way the
              // desk lamp actually falls across the panel
              background:
                "radial-gradient(90% 120% at 22% -10%, #2b2722 0%, #201d19 42%, #131211 100%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: DUR.ui, ease: EASE.out }}
          >
            {/* menu bar — translucent, vibrancy-blurred, macOS proportions */}
            <div
              className="flex items-center justify-between px-4 py-1 font-mono text-[10px] backdrop-blur-xl"
              style={{
                background: "rgba(255,255,255,0.05)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                color: OS.dim,
              }}
            >
              <div className="flex items-center gap-3.5">
                <span className="text-[11px] leading-none" style={{ color: OS.txt }}>
                  ⌘
                </span>
                <span className="font-semibold" style={{ color: OS.txt }}>
                  RM-OS
                </span>
                <span>Projects</span>
                <span>Window</span>
              </div>
              <div className="flex items-center gap-3.5">
                <span>{day}</span>
                <span className="tabular-nums" style={{ color: OS.txt }}>
                  {hh}
                  <span className="cursor-blink">:</span>
                  {mm}
                </span>
                <button
                  onClick={closePortal}
                  className="rounded px-1.5 py-0.5 transition-colors hover:bg-white/10"
                  style={{ color: OS.dim }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = OS.txt)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = OS.dim)}
                >
                  ⏻
                </button>
              </div>
            </div>

            <div
              className="relative flex-1 touch-none"
              onPointerDown={(e) => {
                if (e.target !== e.currentTarget) return;
                setSelectedIcons(new Set());
                e.currentTarget.setPointerCapture(e.pointerId);
                const x = e.nativeEvent.offsetX;
                const y = e.nativeEvent.offsetY;
                dragStart.current = { x, y };
                setSelectionBox({ x, y, w: 0, h: 0 });
              }}
              onPointerMove={(e) => {
                if (!dragStart.current) return;

                // With pointer capture, e.target is always e.currentTarget.
                // nativeEvent.offsetX/Y correctly accounts for 3D CSS transforms!
                const currentX = Math.max(0, Math.min(e.nativeEvent.offsetX, e.currentTarget.offsetWidth));
                const currentY = Math.max(0, Math.min(e.nativeEvent.offsetY, e.currentTarget.offsetHeight));

                const sx = dragStart.current.x;
                const sy = dragStart.current.y;
                const boxX = Math.min(sx, currentX);
                const boxY = Math.min(sy, currentY);
                const boxW = Math.abs(currentX - sx);
                const boxH = Math.abs(currentY - sy);
                setSelectionBox({ x: boxX, y: boxY, w: boxW, h: boxH });

                const newSelected = new Set<number>();
                for (let i = 0; i < PROJECTS.length; i++) {
                  const iconY = 12 + i * 70;
                  const iconX = 12;
                  if (boxX < iconX + 96 && boxX + boxW > iconX && boxY < iconY + 66 && boxY + boxH > iconY) {
                    newSelected.add(i);
                  }
                }
                setSelectedIcons(newSelected);
              }}
              onPointerUp={(e) => {
                if (dragStart.current) {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                  dragStart.current = null;
                  setSelectionBox(null);
                }
              }}
            >
              {selectionBox && (
                <div
                  className="pointer-events-none absolute z-50 border"
                  style={{
                    left: selectionBox.x,
                    top: selectionBox.y,
                    width: selectionBox.w,
                    height: selectionBox.h,
                    backgroundColor: "rgba(0, 120, 215, 0.2)",
                    borderColor: "rgba(0, 120, 215, 0.6)",
                  }}
                />
              )}
              {/* desktop icons — all projects visible instantly */}
              <div className="absolute top-3 left-3 flex flex-col gap-1">
                {PROJECTS.map((p, i) => (
                  <motion.button
                    key={p.title}
                    onClick={(e) => { e.stopPropagation(); setSelectedIcons(new Set([i])); }}
                    onDoubleClick={() => setApp(i)}
                    className="group flex w-[96px] flex-col items-center gap-1 rounded-md px-1.5 py-1.5 transition-colors"
                    style={{ background: selectedIcons.has(i) ? "rgba(255,255,255,0.09)" : "transparent" }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.05, duration: DUR.ui, ease: EASE.out }}
                  >
                    <AppIcon
                      label={p.title}
                      tint={APP_TINTS[i % APP_TINTS.length]}
                      size={38}
                      radius={10}
                    />
                    <span
                      className="max-w-full text-center text-[9px] leading-tight break-words"
                      style={{ color: selectedIcons.has(i) ? OS.txt : OS.dim }}
                    >
                      {p.title}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* system app windows — all toggled from the dock */}
              <AnimatePresence>
                {openApps.has("terminal") && <TerminalWindow onClose={() => closeApp("terminal")} />}
              </AnimatePresence>
              <AnimatePresence>
                {openApps.has("notes") && <NotesWindow onClose={() => closeApp("notes")} />}
              </AnimatePresence>
              <AnimatePresence>
                {openApps.has("keyboard") && <KeyboardWindow onClose={() => closeApp("keyboard")} />}
              </AnimatePresence>
              <AnimatePresence>
                {openApps.has("music") && <MusicWindow onClose={() => closeApp("music")} />}
              </AnimatePresence>

              {/* wallpaper idle state — live clock, blinking colon */}
              {app === null && (
                <motion.div
                  className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center select-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: DUR.move, ease: EASE.out }}
                >
                  <p
                    className="text-[46px] leading-none font-extralight tracking-tight tabular-nums"
                    style={{ color: `${OS.txt}d0` }}
                  >
                    {hh}
                    <span className="cursor-blink font-thin">:</span>
                    {mm}
                  </p>
                  <p
                    className="mt-3 font-mono text-[9px] tracking-[0.38em] uppercase"
                    style={{ color: OS.faint }}
                  >
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
                    className="absolute top-3 right-4 w-[272px] rounded-xl px-3.5 py-2.5 text-left backdrop-blur-xl"
                    style={{
                      background: "rgba(38,34,29,0.82)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
                    }}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16, transition: { duration: DUR.tap, ease: EASE.in } }}
                    transition={{ duration: DUR.ui, ease: EASE.out }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: OS.accent }}
                      />
                      <p
                        className="font-mono text-[8px] tracking-[0.22em] uppercase"
                        style={{ color: OS.faint }}
                      >
                        RM-OS · welcome
                      </p>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-snug" style={{ color: OS.txt }}>
                      Hi — I&apos;m Ritankar. Four shipped projects on this desktop; the
                      resume lives in the dock.
                    </p>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* app window */}
              <AnimatePresence mode="popLayout">
                {app !== null && (
                  <motion.section
                    key={app}
                    className="absolute top-3 right-4 bottom-13 left-32 flex flex-col overflow-hidden rounded-xl backdrop-blur-2xl"
                    style={{
                      background: "rgba(30,27,23,0.94)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      boxShadow:
                        "0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)",
                    }}
                    initial={{ opacity: 0, y: 22, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 14, scale: 0.96 }}
                    transition={{ duration: DUR.tap, ease: EASE.out }}
                  >
                    {/* titlebar — real traffic lights, glyphs on hover */}
                    <div
                      className="group/bar flex items-center gap-1.5 px-3 py-2"
                      style={{
                        background: "rgba(255,255,255,0.035)",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <button
                        onClick={() => setApp(null)}
                        aria-label="Close window"
                        className="flex h-[11px] w-[11px] items-center justify-center rounded-full text-[8px] leading-none font-bold text-black/55 opacity-100"
                        style={{ background: "#ff5f57" }}
                      >
                        <span className="opacity-0 transition-opacity group-hover/bar:opacity-100">
                          ✕
                        </span>
                      </button>
                      <span
                        className="h-[11px] w-[11px] rounded-full"
                        style={{ background: "#febc2e" }}
                      />
                      <span
                        className="h-[11px] w-[11px] rounded-full"
                        style={{ background: "#28c840" }}
                      />
                      <span
                        className="ml-2 text-[10px] font-medium"
                        style={{ color: OS.txt }}
                      >
                        {PROJECTS[app].title}
                      </span>
                      <span className="ml-auto font-mono text-[9px]" style={{ color: OS.faint }}>
                        {PROJECTS[app].period}
                      </span>
                    </div>

                    <div className="os-scroll overflow-y-auto px-4 py-3">
                      <div className="flex items-center gap-2">
                        <AppIcon
                          label={PROJECTS[app].title}
                          tint={APP_TINTS[app % APP_TINTS.length]}
                          size={26}
                          radius={7}
                        />
                        <div>
                          <p
                            className="font-mono text-[9px] tracking-[0.18em] uppercase"
                            style={{ color: APP_TINTS[app % APP_TINTS.length] }}
                          >
                            {PROJECTS[app].role}
                          </p>
                          {PROJECTS[app].context && (
                            <p className="text-[11px]" style={{ color: OS.dim }}>
                              {PROJECTS[app].context}
                            </p>
                          )}
                        </div>
                      </div>

                      <ul className="mt-3 space-y-1.5">
                        {PROJECTS[app].bullets.map((b, i) => (
                          <motion.li
                            key={b}
                            className="flex gap-2 text-[11px] leading-relaxed"
                            style={{ color: OS.txt }}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.06 + i * 0.04, duration: DUR.tap, ease: EASE.out }}
                          >
                            <span
                              className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full"
                              style={{ background: APP_TINTS[app % APP_TINTS.length] }}
                            />
                            <span>{b}</span>
                          </motion.li>
                        ))}
                      </ul>

                      <div className="mt-3 flex flex-wrap gap-1">
                        {PROJECTS[app].tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-md px-1.5 py-0.5 font-mono text-[9px]"
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.07)",
                              color: OS.dim,
                            }}
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
                className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 items-end gap-1.5 rounded-2xl px-2 py-1.5 backdrop-blur-2xl"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  boxShadow:
                    "0 12px 34px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.10)",
                }}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: DUR.ui, ease: EASE.out }}
              >
                {MACOS_DOCK.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => toggleApp(d.id)}
                    className="group relative flex flex-col items-center"
                  >
                    <DockTip label={d.label} />
                    <span className="transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-110">
                      <MacOSDockIcon glyph={d.glyph} bg={d.bg} />
                    </span>
                    <span
                      className="mt-0.5 h-[3px] w-[3px] rounded-full transition-opacity"
                      style={{ background: OS.txt, opacity: openApps.has(d.id) ? 0.8 : 0 }}
                    />
                  </button>
                ))}
                <div className="mx-0.5 mb-1 h-6 w-px" style={{ background: "rgba(255,255,255,0.12)" }} />
                <a
                  href={PROFILE.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex flex-col items-center"
                >
                  <DockTip label="Resume.pdf" />
                  <span className="transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-110">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg font-mono text-[9px] font-semibold"
                      style={{
                        background: "linear-gradient(160deg, #f2ece0, #cec6b6)",
                        color: "#4a4335",
                        boxShadow:
                          "inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 6px rgba(0,0,0,0.35)",
                      }}
                    >
                      CV
                    </span>
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

/** one squircle icon, used at three sizes — desktop, titlebar, dock */
function AppIcon({
  label,
  tint,
  size,
  radius,
}: {
  label: string;
  tint: string;
  size: number;
  radius: number;
}) {
  return (
    <span
      className="flex items-center justify-center font-mono font-semibold"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        fontSize: size * 0.34,
        // glass-over-tint: a light top edge and a darker floor, so the
        // icon reads as a physical chip rather than a flat swatch
        background: `linear-gradient(160deg, ${tint}, ${tint}88)`,
        color: "rgba(0,0,0,0.62)",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.35)`,
      }}
    >
      {label.replace(/[^A-Za-z]/g, "").slice(0, 2)}
    </span>
  );
}

/** dock tooltip — the label that rises on hover */
function DockTip({ label }: { label: string }) {
  return (
    <span
      className="pointer-events-none absolute -top-6 rounded-md px-1.5 py-0.5 font-mono text-[8px] whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100"
      style={{
        background: "rgba(20,18,16,0.92)",
        border: "1px solid rgba(255,255,255,0.10)",
        color: "#ece7dd",
      }}
    >
      {label}
    </span>
  );
}

/** 
 * Shared window chrome for all system apps — draggable, opaque, traffic lights.
 * Red = close, Yellow = minimize (hide), Green = toggle fullscreen.
 */
function OSWindowChrome({
  title,
  onClose,
  onMinimize,
  children,
  className,
  style,
}: {
  title: string;
  onClose: () => void;
  onMinimize?: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const dragControls = useDragControls();
  const [maximized, setMaximized] = useState(false);

  return (
    <motion.div
      className={`absolute flex flex-col overflow-hidden rounded-lg ${className ?? ""}`}
      style={{
        background: "#1a1816",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        zIndex: 10,
        ...(maximized
          ? { top: 0, left: 0, right: 0, bottom: 44, width: "auto", height: "auto", borderRadius: 0, transform: "none" }
          : style),
      }}
      drag={!maximized}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: DUR.ui, ease: EASE.out }}
      layout
    >
      {/* title bar — drag handle */}
      <div
        className="group/tb flex items-center gap-1.5 px-3 py-1.5 border-b cursor-grab active:cursor-grabbing select-none"
        style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.06)" }}
        onPointerDown={(e) => { if (!maximized) dragControls.start(e); }}
      >
        {/* red — close */}
        <button
          onClick={onClose}
          className="flex h-[9px] w-[9px] items-center justify-center rounded-full text-[6px] leading-none font-bold text-black/50"
          style={{ background: "#ff5f57" }}
        >
          <span className="opacity-0 transition-opacity group-hover/tb:opacity-100">✕</span>
        </button>
        {/* yellow — minimize */}
        <button
          onClick={onMinimize ?? onClose}
          className="flex h-[9px] w-[9px] items-center justify-center rounded-full text-[6px] leading-none font-bold text-black/50"
          style={{ background: "#febc2e" }}
        >
          <span className="opacity-0 transition-opacity group-hover/tb:opacity-100">−</span>
        </button>
        {/* green — fullscreen toggle */}
        <button
          onClick={() => setMaximized((m) => !m)}
          className="flex h-[9px] w-[9px] items-center justify-center rounded-full text-[6px] leading-none font-bold text-black/50"
          style={{ background: "#28c840" }}
        >
          <span className="opacity-0 transition-opacity group-hover/tb:opacity-100">{maximized ? "↙" : "↗"}</span>
        </button>
        <span className="ml-2 font-mono text-[9px] tracking-wide" style={{ color: OS.dim }}>
          {title}
        </span>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </motion.div>
  );
}

/* ===== TERMINAL ===== */
function TerminalWindow({ onClose }: { onClose: () => void }) {
  const [blink, setBlink] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setBlink((b) => !b), 530);
    return () => clearInterval(id);
  }, []);

  return (
    <OSWindowChrome
      title="train_agent.py"
      onClose={onClose}
      style={{ width: 280, right: 8, bottom: 50 }}
    >
      <div className="px-3 py-3 font-mono text-[9px] leading-[1.6]">
        <p><span style={{ color: "#c49ab0" }}>import</span> <span style={{ color: OS.txt }}>torch</span></p>
        <p><span style={{ color: "#c49ab0" }}>from</span> <span style={{ color: OS.txt }}>transformers</span> <span style={{ color: "#c49ab0" }}>import</span> <span style={{ color: OS.txt }}>AutoModel</span></p>
        <br />
        <p style={{ color: OS.dim }}># Initialize cluster...</p>
        <p style={{ color: OS.txt }}>Allocating 4x H100 (80GB) GPUs...</p>
        <p style={{ color: "#a8b48c" }}>Success: cluster connected.</p>
        <br />
        <p style={{ color: OS.txt }}>Epoch 42/100</p>
        <div className="my-1.5 h-1 w-full rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="h-full w-[88%]" style={{ background: OS.accent }} />
        </div>
        <p style={{ color: OS.dim }}>loss: 0.1042 - val_loss: 0.1298</p>
        <p className="mt-1.5" style={{ color: OS.txt }}>
          optimizer.step()
          <span style={{ opacity: blink ? 1 : 0, color: OS.accent }}>_</span>
        </p>
      </div>
    </OSWindowChrome>
  );
}

/* ===== NOTES ===== */
function NotesWindow({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("# Ideas\n\nType anything here...\n");
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // auto-focus the textarea when the window opens
    taRef.current?.focus();
  }, []);

  return (
    <OSWindowChrome
      title="Notes"
      onClose={onClose}
      style={{ width: 240, right: 8, top: 28 }}
    >
      <textarea
        ref={taRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        className="flex-1 resize-none bg-transparent px-3 py-2 font-mono text-[10px] leading-relaxed outline-none"
        style={{ color: OS.txt, height: 160, caretColor: OS.accent }}
      />
      <div
        className="flex items-center justify-between px-3 py-1 border-t font-mono text-[8px]"
        style={{ borderColor: "rgba(255,255,255,0.05)", color: OS.faint }}
      >
        <span>{text.length} chars</span>
        <span>{text.split("\n").length} lines</span>
      </div>
    </OSWindowChrome>
  );
}

/* ===== KEYBOARD ===== */
const KB_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

function KeyboardWindow({ onClose }: { onClose: () => void }) {
  const [typed, setTyped] = useState("");

  const press = (key: string) => {
    if (key === "⌫") setTyped((t) => t.slice(0, -1));
    else setTyped((t) => t + key);
  };

  return (
    <OSWindowChrome
      title="Keyboard"
      onClose={onClose}
      style={{ width: 380, left: "50%", bottom: 50, transform: "translateX(-50%)" }}
    >
      {/* typed text display */}
      <div
        className="mx-2.5 mt-2 rounded-md px-2 py-1.5 font-mono text-[10px] overflow-x-auto whitespace-nowrap"
        style={{
          background: "rgba(0,0,0,0.3)",
          color: OS.txt,
          minHeight: 28,
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {typed || <span style={{ color: OS.faint }}>Start typing...</span>}
        <span className="cursor-blink" style={{ color: OS.accent }}>▍</span>
      </div>

      {/* keyboard grid */}
      <div className="flex flex-col items-center gap-[3px] px-2 py-2">
        {KB_ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-[3px]">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => press(key)}
                className="flex items-center justify-center rounded font-mono text-[9px] font-medium transition-all active:scale-90"
                style={{
                  width: key === "⌫" ? 40 : 30,
                  height: 24,
                  background: key === "⌫" ? "rgba(255,95,87,0.2)" : "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: key === "⌫" ? "#ff5f57" : OS.txt,
                }}
              >
                {key}
              </button>
            ))}
          </div>
        ))}
        {/* bottom row: space + enter */}
        <div className="flex gap-[3px]">
          <button
            onClick={() => press(" ")}
            className="flex items-center justify-center rounded font-mono text-[8px] transition-all active:scale-95"
            style={{
              width: 200,
              height: 24,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: OS.faint,
            }}
          >
            space
          </button>
          <button
            onClick={() => press("\u21B5\n")}
            className="flex items-center justify-center rounded font-mono text-[8px] transition-all active:scale-95"
            style={{
              width: 60,
              height: 24,
              background: "rgba(255,179,97,0.15)",
              border: "1px solid rgba(255,179,97,0.2)",
              color: OS.accent,
            }}
          >
            return
          </button>
        </div>
      </div>
    </OSWindowChrome>
  );
}

/* ===== MUSIC ===== */
/**
 * A real playlist, playing real files.
 * Tracks moved to global store to play in the background across the site.
 */
const clock = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * Speaker / speaker-muted, drawn rather than typed. The mono UI font has
 * gaps in its symbol coverage — a missing glyph renders as a tofu box,
 * which is worse than no icon at all — and an inline SVG also inherits
 * `currentColor`, so the state change is one style prop.
 */
function SpeakerIcon({ muted, size = 12 }: { muted: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.6 6.2h2.5L8.7 3.3v9.4L5.1 9.8H2.6z" fill="currentColor" />
      {muted ? (
        <>
          <path d="M11.3 6.3l3.3 3.4" />
          <path d="M14.6 6.3l-3.3 3.4" />
        </>
      ) : (
        <>
          <path d="M11 6.2a3 3 0 010 3.6" />
          <path d="M13.1 4.4a6 6 0 010 7.2" />
        </>
      )}
    </svg>
  );
}

function MusicWindow({ onClose }: { onClose: () => void }) {
  const { idx, playing, muted, progress: at, len } = useAudioPlayer();
  const track = TRACKS[idx];

  const step = (d: 1 | -1) => {
    const nextIdx = (idx + d + TRACKS.length) % TRACKS.length;
    audioPlayer.playTrack(nextIdx);
  };

  const toggleMute = () => audioPlayer.setMuted(!muted);
  const toggle = () => audioPlayer.togglePlay();
  const seek = (fraction: number) => audioPlayer.seek(fraction);

  const progressPct = len ? (at / len) * 100 : 0;

  return (
    <OSWindowChrome
      title="Music"
      onClose={onClose}
      style={{ width: 240, left: 110, bottom: 50 }}
    >
      <div className="px-3 py-3">
        {/* track info */}
        <p className="font-mono text-[10px] truncate" style={{ color: OS.txt }}>
          {track.name}
        </p>
        <p className="font-mono text-[8px] mt-0.5" style={{ color: OS.faint }}>
          {track.artist}
        </p>

        {/* progress bar */}
        <div
          className="mt-2.5 h-[3px] w-full rounded-full overflow-hidden cursor-pointer"
          style={{ background: "rgba(255,255,255,0.08)" }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            seek((e.clientX - rect.left) / rect.width);
          }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${progressPct}%`, background: "#fa5d6a" }}
          />
        </div>
        <div className="flex justify-between mt-1 font-mono text-[7px]" style={{ color: OS.faint }}>
          <span>{clock(at)}</span>
          <span>{len ? clock(len) : "--:--"}</span>
        </div>

        {/* controls */}
        <div className="flex items-center justify-center gap-3.5 mt-2">
          <button
            onClick={() => step(-1)}
            aria-label="Previous track"
            className="font-mono text-[10px] transition-colors hover:text-white"
            style={{ color: OS.dim }}
          >
            ⏮
          </button>
          <button
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
            className="flex h-7 w-7 items-center justify-center rounded-full transition-transform hover:scale-110"
            style={{
              background: playing ? "rgba(250,93,106,0.2)" : "rgba(255,255,255,0.1)",
              color: playing ? "#fa5d6a" : OS.txt,
              fontSize: 12,
            }}
          >
            {playing ? "⏸" : "▶"}
          </button>
          <button
            onClick={() => step(1)}
            aria-label="Next track"
            className="font-mono text-[10px] transition-colors hover:text-white"
            style={{ color: OS.dim }}
          >
            ⏭
          </button>
          <button
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
            className="flex items-center transition-colors"
            style={{ color: muted ? "#fa5d6a" : OS.dim }}
          >
            <SpeakerIcon muted={muted} />
          </button>
        </div>

        {/* the playlist */}
        <div className="mt-2.5 border-t pt-1.5" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {TRACKS.map((t, i) => (
            <button
              key={t.src}
              onClick={() => audioPlayer.playTrack(i)}
              className="flex w-full items-center gap-1.5 rounded px-1 py-[3px] text-left transition-colors hover:bg-white/5"
              style={{ color: i === idx ? OS.txt : OS.faint }}
            >
              <span className="font-mono text-[7px] w-2 shrink-0" style={{ color: "#fa5d6a" }}>
                {i === idx && playing ? "▶" : ""}
              </span>
              <span className="font-mono text-[8px] truncate">{t.name}</span>
            </button>
          ))}
        </div>
      </div>
    </OSWindowChrome>
  );
}

/** realistic macOS squircle dock icon */
function MacOSDockIcon({ glyph, bg }: { glyph: string; bg: string }) {
  return (
    <span
      className="flex items-center justify-center"
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        background: bg,
        fontSize: glyph.length > 1 ? 9 : 14,
        lineHeight: 1,
        fontFamily: glyph.length > 1 ? "monospace" : "inherit",
        fontWeight: glyph.length > 1 ? 700 : 400,
        color: "#fff",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.35)",
      }}
    >
      {glyph}
    </span>
  );
}

