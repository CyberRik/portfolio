"use client";

import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Html } from "@react-three/drei";
import { PROFILE } from "@/content/portfolio";
import {
  FEATURED,
  isTodo,
  PROJECT_DOCS,
  todoHint,
  TRAINING_LOG,
  type MilestoneId,
  type ProjectId,
} from "@/content/work";
import { TodoNote } from "@/components/os/TodoNote";
import { closePortal, togglePopOut, usePopOut, usePortalSection } from "@/lib/portal";
import { DUR, EASE } from "@/lib/design";
import { audioPlayer, useAudioPlayer, TRACKS } from "@/lib/audioStore";
import { OSWindow } from "@/components/os/OSWindow";
import { OSRouterContext, type OSRoutes } from "@/components/os/OSRouter";
import { ProjectsApp } from "@/components/os/ProjectsApp";
import { TimelineApp } from "@/components/os/TimelineApp";
import { APP_TINTS, OS } from "@/components/os/theme";

export const OSDesktopContext = createContext<{ isPoppedOut: boolean }>({ isPoppedOut: false });

export function useOSDesktop() {
  return useContext(OSDesktopContext);
}

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

/**
 * Dock apps. Timeline and Projects lead — they're the substance of the
 * machine; the four utilities that follow are what makes it feel lived
 * in. The divider between the two groups is drawn in the dock itself.
 */
const MACOS_DOCK: { id: string; label: string; glyph: string; bg: string }[] = [
  { id: "timeline", label: "Timeline", glyph: "◷", bg: "linear-gradient(160deg, #ffb361, #d98a3f)" },
  { id: "projects", label: "Projects", glyph: "◧", bg: "linear-gradient(160deg, #7f8fb8, #4d5b80)" },
  { id: "terminal", label: "Terminal", glyph: "▸_", bg: "linear-gradient(160deg, #1d1d1f, #3a3a3c)" },
  { id: "keyboard", label: "Keyboard", glyph: "⌨", bg: "linear-gradient(160deg, #5e5e63, #3a3a3c)" },
  { id: "notes", label: "Notes", glyph: "✎", bg: "linear-gradient(160deg, #f9e787, #f5d45a)" },
  { id: "music", label: "Music", glyph: "♫", bg: "linear-gradient(160deg, #fa5d6a, #d1344a)" },
];

/** desktop icons — the featured work, one double-click from its case study */
const DESKTOP_ICONS = FEATURED;

export function MonitorScreen() {
  const active = usePortalSection() === "projects";
  const poppedOut = usePopOut();

  if (!active) return null;
  return (
    <Html
      transform
      distanceFactor={0.5}
      position={[0, 0, 0.026]}
      zIndexRange={[35, 0]}
      style={{ width: CSS_W, height: CSS_H }}
    >
      {poppedOut ? (
        <div
          className="flex h-full w-full flex-col items-center justify-center bg-black/90 font-mono text-[11px]"
          style={{ color: OS.dim }}
        >
          <span className="text-[16px] font-semibold text-[#ffd9a8]">RM-OS</span>
          <span className="mt-1">Active on full screen display</span>
          <button
            onClick={togglePopOut}
            className="mt-3 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] text-[#ffd9a8] transition-colors hover:bg-white/20"
          >
            ⤓ Dock back to Desk
          </button>
        </div>
      ) : (
        <Desktop />
      )}
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

export function Desktop({ isPoppedOut = false }: { isPoppedOut?: boolean }) {
  const [awake, setAwake] = useState(false);
  /** which case study the Projects app is showing; null = the tab list */
  const [project, setProject] = useState<ProjectId | null>(null);
  /** which Timeline chapter is expanded */
  const [chapter, setChapter] = useState<MilestoneId | null>(null);
  const [selectedIcons, setSelectedIcons] = useState<Set<number>>(new Set());
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [toast, setToast] = useState(false);
  // the machine boots into the Timeline — the story, not a utility
  const [openApps, setOpenApps] = useState<string[]>(["timeline"]);
  const toggleApp = useCallback((id: string) => {
    setOpenApps((prev) => {
      if (prev.includes(id)) return prev.filter((a) => a !== id);
      return [...prev, id];
    });
  }, []);
  const closeApp = useCallback((id: string) => {
    setOpenApps((prev) => prev.filter((a) => a !== id));
  }, []);
  const focusApp = useCallback((id: string) => {
    setOpenApps((prev) => {
      if (!prev.includes(id)) return prev;
      if (prev[prev.length - 1] === id) return prev;
      return [...prev.filter((a) => a !== id), id];
    });
  }, []);
  /**
   * The cross-links. Opening a project from the Timeline raises the
   * Projects app on that case study; opening a chapter from a project
   * raises the Timeline with it expanded. Both go through here so the
   * apps never have to know about each other.
   */
  const routes = useMemo<OSRoutes>(
    () => ({
      openProject: (id) => {
        setProject(id);
        focusApp("projects");
        setOpenApps((prev) => (prev.includes("projects") ? prev : [...prev, "projects"]));
      },
      openMilestone: (id) => {
        setChapter(id);
        focusApp("timeline");
        setOpenApps((prev) => (prev.includes("timeline") ? prev : [...prev, "timeline"]));
      },
      openApp: (id) => {
        focusApp(id);
        setOpenApps((prev) => (prev.includes(id) ? prev : [...prev, id]));
      },
    }),
    [focusApp],
  );

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
    <OSDesktopContext.Provider value={{ isPoppedOut }}>
    <OSRouterContext.Provider value={routes}>
    <motion.div
      // os-surface swaps the room's cursor for RM-OS's own for as long
      // as the pointer is on the glass (see globals.css)
      className="os-surface relative overflow-hidden bg-black"
      style={isPoppedOut ? { width: "100%", height: "100%" } : { width: CSS_W, height: CSS_H }}
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
            {/* menu bar — translucent, vibrancy-blurred, macOS proportions.
                `whitespace-nowrap` is load-bearing on a phone: popped out
                fullscreen at 390px this row is wider than the viewport, and
                without it the clock broke into "Fri / 22 49 / Aug" and the
                pop-out button stacked one word per line. The items that
                cannot fit are dropped below `sm` instead (see below) —
                wrapping a menu bar never reads as a menu bar. */}
            <div
              className={`flex items-center justify-between gap-2 font-mono whitespace-nowrap backdrop-blur-xl select-none ${
                isPoppedOut
                  ? "px-3 py-2 text-[11px] sm:px-6 sm:text-[12px] md:text-[13px]"
                  : "px-4 py-1.5 text-[10px] md:text-[11px]"
              }`}
              style={{
                background: "rgba(255,255,255,0.05)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                color: OS.dim,
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3.5">
                <span className={isPoppedOut ? "text-[14px] leading-none" : "text-[11px] leading-none"} style={{ color: OS.txt }}>
                  ⌘
                </span>
                <span className="font-semibold" style={{ color: OS.txt }}>
                  RM-OS
                </span>
                {/* Inert menu titles — pure set dressing, and the first
                    things to go when the bar has to fit a phone. */}
                <span className="hidden sm:inline">Projects</span>
                <span className="hidden sm:inline">Window</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3.5">
                <span className="hidden sm:inline">{day}</span>
                <span className="tabular-nums" style={{ color: OS.txt }}>
                  {hh}
                  <span className="cursor-blink">:</span>
                  {mm}
                </span>
                <button
                  onClick={togglePopOut}
                  className={`flex items-center gap-1 rounded font-mono transition-colors hover:bg-white/10 ${
                    isPoppedOut ? "px-2 py-0.5 text-[11px]" : "px-1.5 py-0.5 text-[9.5px]"
                  }`}
                  style={{ color: isPoppedOut ? OS.accent : OS.dim }}
                  title={isPoppedOut ? "Dock back to 3D Desk" : "Pop Out to Fullscreen"}
                >
                  <span>{isPoppedOut ? "⤓" : "⤢"}</span>
                  {/* Icon-only on a phone. The glyph plus the title
                      attribute carry the meaning, and this label is the
                      single widest item in the bar. */}
                  <span className="hidden sm:inline">
                    {isPoppedOut ? "Dock to Desk" : "Pop Out"}
                  </span>
                </button>
                <button
                  onClick={closePortal}
                  className="rounded px-1.5 py-0.5 transition-colors hover:bg-white/10"
                  style={{ color: OS.dim }}
                  title="Power off / Close"
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
                for (let i = 0; i < DESKTOP_ICONS.length; i++) {
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
              {/* desktop icons — the featured work, straight to its case study */}
              <div className="absolute top-3 left-3 flex flex-col gap-1">
                {DESKTOP_ICONS.map((id, i) => (
                  <motion.button
                    key={id}
                    onClick={(e) => { e.stopPropagation(); setSelectedIcons(new Set([i])); }}
                    onDoubleClick={() => routes.openProject(id)}
                    className="group flex w-[96px] flex-col items-center gap-1 rounded-md px-1.5 py-1.5 transition-colors"
                    style={{ background: selectedIcons.has(i) ? "rgba(255,255,255,0.09)" : "transparent" }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.05, duration: DUR.ui, ease: EASE.out }}
                  >
                    <AppIcon
                      label={PROJECT_DOCS[id].title}
                      tint={APP_TINTS[i % APP_TINTS.length]}
                      size={38}
                      radius={10}
                    />
                    <span
                      className="max-w-full text-center text-[9px] leading-tight break-words"
                      style={{ color: selectedIcons.has(i) ? OS.txt : OS.dim }}
                    >
                      {PROJECT_DOCS[id].title}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* the two content apps — the substance of the machine */}
              <AnimatePresence>
                {openApps.includes("timeline") && (
                  <TimelineApp
                    onClose={() => closeApp("timeline")}
                    onFocus={() => focusApp("timeline")}
                    zIndex={10 + openApps.indexOf("timeline")}
                    expanded={chapter}
                    onExpand={setChapter}
                  />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {openApps.includes("projects") && (
                  <ProjectsApp
                    onClose={() => closeApp("projects")}
                    onFocus={() => focusApp("projects")}
                    zIndex={10 + openApps.indexOf("projects")}
                    selected={project}
                    onSelect={setProject}
                  />
                )}
              </AnimatePresence>

              {/* system app windows — all toggled from the dock */}
              <AnimatePresence>
                {openApps.includes("terminal") && <TerminalWindow onClose={() => closeApp("terminal")} onFocus={() => focusApp("terminal")} zIndex={10 + openApps.indexOf("terminal")} />}
              </AnimatePresence>
              <AnimatePresence>
                {openApps.includes("notes") && <NotesWindow onClose={() => closeApp("notes")} onFocus={() => focusApp("notes")} zIndex={10 + openApps.indexOf("notes")} />}
              </AnimatePresence>
              <AnimatePresence>
                {openApps.includes("keyboard") && <KeyboardWindow onClose={() => closeApp("keyboard")} onFocus={() => focusApp("keyboard")} zIndex={10 + openApps.indexOf("keyboard")} />}
              </AnimatePresence>
              <AnimatePresence>
                {openApps.includes("music") && <MusicWindow onClose={() => closeApp("music")} onFocus={() => focusApp("music")} zIndex={10 + openApps.indexOf("music")} />}
              </AnimatePresence>

              {/* wallpaper idle state — live clock, blinking colon.
                  Hidden once a content app owns the panel. */}
              {!openApps.includes("timeline") && !openApps.includes("projects") && (
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
                      Hi — I&apos;m Ritankar. Timeline is the story; Projects has the case
                      studies. The résumé lives in the dock.
                    </p>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* dock — content apps, utilities, then the résumé */}
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
                {MACOS_DOCK.map((d, i) => (
                  <div key={d.id} className="flex items-end gap-1.5">
                    <button
                      onClick={() => toggleApp(d.id)}
                      className="group relative flex flex-col items-center"
                    >
                      <DockTip label={d.label} />
                      <span className="transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-110">
                        <MacOSDockIcon glyph={d.glyph} bg={d.bg} />
                      </span>
                      <span
                        className="mt-0.5 h-[3px] w-[3px] rounded-full transition-opacity"
                        style={{ background: OS.txt, opacity: openApps.includes(d.id) ? 0.8 : 0 }}
                      />
                    </button>
                    {/* content apps sit apart from the utilities */}
                    {i === 1 && (
                      <div className="mx-0.5 mb-1 h-6 w-px" style={{ background: "rgba(255,255,255,0.12)" }} />
                    )}
                  </div>
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
    </OSRouterContext.Provider>
    </OSDesktopContext.Provider>
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

/* ===== TERMINAL ===== */
/**
 * A viewer over TRAINING_LOG, not a prop.
 *
 * This window used to display an invented run — an H100 cluster, an
 * epoch counter, a loss curve — none of which happened. Everything it
 * shows now comes from content/work.ts, where what's publishable is
 * documented alongside it. Nothing here is generated at render time.
 */
function TerminalWindow({ onClose, onFocus, zIndex }: { onClose: () => void; onFocus: () => void; zIndex: number }) {
  const [blink, setBlink] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setBlink((b) => !b), 530);
    return () => clearInterval(id);
  }, []);

  const tone: Record<string, string> = {
    dim: OS.dim,
    txt: OS.txt,
    ok: "#a8b48c",
    accent: OS.accent,
  };

  return (
    <OSWindow
      title={TRAINING_LOG.title}
      onClose={onClose}
      onFocus={onFocus}
      style={{ width: 300, right: 8, bottom: 50, zIndex }}
    >
      <div className="px-3 py-2.5 font-mono text-[9px] leading-[1.6]">
        {TRAINING_LOG.lines.map((l, i) => {
          if (l.bar !== undefined) {
            return (
              <div
                key={i}
                className="my-1.5 h-1 w-full overflow-hidden rounded-full"
                style={{ background: "rgba(0,0,0,0.4)" }}
              >
                <div className="h-full" style={{ width: `${l.bar * 100}%`, background: OS.accent }} />
              </div>
            );
          }
          if (isTodo(l.text)) {
            return (
              <div key={i} className="my-1.5">
                <TodoNote hint={todoHint(l.text)} />
              </div>
            );
          }
          if (!l.text) return <br key={i} />;
          return (
            <p key={i} style={{ color: tone[l.tone ?? "txt"] }}>
              {l.text}
            </p>
          );
        })}
        <p style={{ color: OS.txt }}>
          $<span style={{ opacity: blink ? 1 : 0, color: OS.accent }}>_</span>
        </p>
      </div>
      {/* where these numbers come from — the log is attributable */}
      <div
        className="border-t px-3 py-1 font-mono text-[7.5px] leading-snug"
        style={{ borderColor: "rgba(255,255,255,0.05)", color: OS.faint }}
      >
        {TRAINING_LOG.provenance}
      </div>
    </OSWindow>
  );
}

/* ===== NOTES ===== */
function NotesWindow({ onClose, onFocus, zIndex }: { onClose: () => void; onFocus: () => void; zIndex: number }) {
  const [text, setText] = useState("# Ideas\n\nType anything here...\n");
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // auto-focus the textarea when the window opens
    taRef.current?.focus();
  }, []);

  return (
    <OSWindow
      title="Notes"
      onClose={onClose}
      onFocus={onFocus}
      style={{ width: 240, right: 8, top: 28, zIndex }}
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
    </OSWindow>
  );
}

/* ===== KEYBOARD ===== */
const KB_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

function KeyboardWindow({ onClose, onFocus, zIndex }: { onClose: () => void; onFocus: () => void; zIndex: number }) {
  const [typed, setTyped] = useState("");

  const press = (key: string) => {
    if (key === "⌫") setTyped((t) => t.slice(0, -1));
    else setTyped((t) => t + key);
  };

  return (
    <OSWindow
      title="Keyboard"
      onClose={onClose}
      onFocus={onFocus}
      style={{ width: 380, left: "50%", bottom: 50, transform: "translateX(-50%)", zIndex }}
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
        <span className="cursor-blink" style={{ color: OS.accent }}>|</span>
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
    </OSWindow>
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

function MusicWindow({ onClose, onFocus, zIndex }: { onClose: () => void; onFocus: () => void; zIndex: number }) {
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
    <OSWindow
      title="Music"
      onClose={onClose}
      onFocus={onFocus}
      style={{ width: 240, left: 110, bottom: 50, zIndex }}
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
    </OSWindow>
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

