"use client";

import { useState } from "react";
import { motion, useDragControls } from "framer-motion";
import { DUR, EASE } from "@/lib/design";
import { OS } from "./theme";

/**
 * Shared window chrome for every RM-OS app — draggable, opaque,
 * traffic lights. Red = close, yellow = minimize (hide), green =
 * toggle fullscreen.
 *
 * Moved here from MonitorScreen so the Timeline and Projects apps can
 * use the same chrome without importing the desktop. Behaviour is
 * unchanged; `defaultMaximized` is the one addition — the project
 * workspace is dense enough that it wants the whole panel from the
 * moment it opens.
 */
export function OSWindow({
  title,
  onClose,
  onMinimize,
  onFocus,
  children,
  className,
  style,
  defaultMaximized = false,
}: {
  title: string;
  onClose: () => void;
  onMinimize?: () => void;
  onFocus?: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  defaultMaximized?: boolean;
}) {
  const dragControls = useDragControls();
  const [maximized, setMaximized] = useState(defaultMaximized);

  return (
    <motion.div
      onPointerDownCapture={onFocus}
      className={`absolute flex flex-col overflow-hidden rounded-lg ${className ?? ""}`}
      style={{
        background: "#1a1816",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        zIndex: maximized ? 50 : (style?.zIndex ?? 10),
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
    >
      {/* title bar — drag handle */}
      <div
        className="group/tb flex shrink-0 cursor-grab items-center gap-1.5 border-b px-3 py-1.5 select-none active:cursor-grabbing"
        style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.06)" }}
        onPointerDown={(e) => {
          if (!maximized) dragControls.start(e);
        }}
        onDoubleClick={() => setMaximized((m) => !m)}
      >
        {/* red — close */}
        <button
          onClick={onClose}
          aria-label="Close window"
          className="flex h-[9px] w-[9px] items-center justify-center rounded-full text-[6px] leading-none font-bold text-black/50"
          style={{ background: "#ff5f57" }}
        >
          <span className="opacity-0 transition-opacity group-hover/tb:opacity-100">✕</span>
        </button>
        {/* yellow — minimize */}
        <button
          onClick={onMinimize ?? onClose}
          aria-label="Minimize window"
          className="flex h-[9px] w-[9px] items-center justify-center rounded-full text-[6px] leading-none font-bold text-black/50"
          style={{ background: "#febc2e" }}
        >
          <span className="opacity-0 transition-opacity group-hover/tb:opacity-100">−</span>
        </button>
        {/* green — fullscreen toggle */}
        <button
          onClick={() => setMaximized((m) => !m)}
          aria-label={maximized ? "Restore window" : "Maximize window"}
          className="flex h-[9px] w-[9px] items-center justify-center rounded-full text-[6px] leading-none font-bold text-black/50"
          style={{ background: "#28c840" }}
        >
          <span className="opacity-0 transition-opacity group-hover/tb:opacity-100">{maximized ? "↙" : "↗"}</span>
        </button>
        <span className="ml-2 font-mono text-[9px] tracking-wide" style={{ color: OS.dim }}>
          {title}
        </span>
      </div>
      {/* flex-col + min-h-0 lets a child pane own the scrolling; overflow-auto
          keeps the old utility windows behaving as they did before */}
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">{children}</div>
    </motion.div>
  );
}
