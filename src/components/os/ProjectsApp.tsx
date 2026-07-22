"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ARCHIVE, FEATURED, PROJECT_DOCS, type ProjectId } from "@/content/work";
import { DUR, EASE } from "@/lib/design";
import { OSWindow } from "./OSWindow";
import { ProjectWorkspace } from "./ProjectWorkspace";
import { APP_TINTS, OS } from "./theme";

/**
 * PROJECTS — a two-tab browser over the work, and the workspace it
 * opens into.
 *
 * Featured is the argument: the five projects that make the case for
 * what I build now. Archive is the evidence underneath it — earlier
 * work that still stands up, kept one click away rather than deleted.
 *
 * The list and the case study share one window: selecting a project
 * swaps the body rather than spawning a second window, because two
 * overlapping windows on a 1152×448 panel is how an OS stops feeling
 * like an OS.
 */

import { useOSDesktop } from "@/components/objects/MonitorScreen";

// ...

export function ProjectsApp({
  onClose,
  onFocus,
  zIndex,
  selected,
  onSelect,
}: {
  onClose: () => void;
  onFocus: () => void;
  zIndex: number;
  /** driven from the desktop so Timeline cross-links can set it */
  selected: ProjectId | null;
  onSelect: (id: ProjectId | null) => void;
}) {
  const [tab, setTab] = useState<"featured" | "archive">("featured");
  const { isPoppedOut } = useOSDesktop();

  // opening a project from elsewhere in the OS should land you on the
  // tab it actually lives in
  useEffect(() => {
    if (selected) setTab(PROJECT_DOCS[selected].tier);
  }, [selected]);

  const ids = tab === "featured" ? FEATURED : ARCHIVE;

  return (
    <OSWindow
      title={selected ? `Projects — ${PROJECT_DOCS[selected].title}` : "Projects"}
      onClose={onClose}
      onFocus={onFocus}
      defaultMaximized
      style={{ width: isPoppedOut ? "min(92vw, 1280px)" : 720, left: isPoppedOut ? "50%" : 150, transform: isPoppedOut ? "translateX(-50%)" : undefined, top: isPoppedOut ? 30 : 20, zIndex }}
    >
      {selected ? (
        <>
          <Breadcrumb
            tier={PROJECT_DOCS[selected].tier}
            title={PROJECT_DOCS[selected].title}
            onBack={() => onSelect(null)}
            isPoppedOut={isPoppedOut}
          />
          <ProjectWorkspace id={selected} />
        </>
      ) : (
        <>
          {/* tabs */}
          <div
            className={`flex shrink-0 items-center gap-1.5 border-b ${isPoppedOut ? "px-4 py-2" : "px-3 py-1.5"}`}
            style={{ borderColor: OS.lineSoft }}
          >
            <Tab label="Featured" on={tab === "featured"} onClick={() => setTab("featured")} isPoppedOut={isPoppedOut} />
            <Tab label="Archive" on={tab === "archive"} onClick={() => setTab("archive")} isPoppedOut={isPoppedOut} />
            <span className={`ml-auto font-mono ${isPoppedOut ? "text-[11px]" : "text-[8px]"}`} style={{ color: OS.faint }}>
              {ids.length} projects
            </span>
          </div>

          <div className={`os-scroll min-h-0 flex-1 overflow-y-auto ${isPoppedOut ? "px-12 py-10" : "px-3 py-2.5"}`}>
            <motion.div
              key={tab}
              className={isPoppedOut ? "mx-auto flex max-w-4xl flex-col gap-3" : "flex flex-col gap-1"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR.ui, ease: EASE.out }}
            >
              {ids.map((id, i) => (
                <ProjectRow key={id} id={id} index={i} onOpen={() => onSelect(id)} isPoppedOut={isPoppedOut} />
              ))}
            </motion.div>
          </div>
        </>
      )}
    </OSWindow>
  );
}

function Tab({ label, on, onClick, isPoppedOut = false }: { label: string; on: boolean; onClick: () => void; isPoppedOut?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md transition-colors ${isPoppedOut ? "px-3 py-1 text-[12px]" : "px-2 py-[3px] text-[10px]"}`}
      style={{
        background: on ? "rgba(255,255,255,0.08)" : "transparent",
        color: on ? OS.txt : OS.dim,
      }}
    >
      {label}
    </button>
  );
}

function Breadcrumb({ tier, title, onBack, isPoppedOut = false }: { tier: string; title: string; onBack: () => void; isPoppedOut?: boolean }) {
  return (
    <div
      className={`flex shrink-0 items-center gap-2 border-b font-mono ${isPoppedOut ? "px-4 py-2.5 text-[11px]" : "px-3 py-1.5 text-[9px]"}`}
      style={{ borderColor: OS.lineSoft }}
    >
      <button onClick={onBack} className="transition-colors hover:text-white" style={{ color: OS.dim }}>
        ← {tier === "featured" ? "Featured" : "Archive"}
      </button>
      <span style={{ color: OS.faint }}>/</span>
      <span style={{ color: OS.txt }}>{title}</span>
    </div>
  );
}

function ProjectRow({ id, index, onOpen, isPoppedOut = false }: { id: ProjectId; index: number; onOpen: () => void; isPoppedOut?: boolean }) {
  const doc = PROJECT_DOCS[id];
  const tint = APP_TINTS[index % APP_TINTS.length];
  return (
    <button
      onClick={onOpen}
      className={`group flex items-center gap-3 rounded-md text-left transition-colors hover:bg-white/[0.06] ${
        isPoppedOut ? "px-3 py-2.5" : "px-2 py-1.5"
      }`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-lg font-mono font-semibold ${
          isPoppedOut ? "h-9 w-9 text-[11px]" : "h-7 w-7 text-[9px]"
        }`}
        style={{
          background: `linear-gradient(160deg, ${tint}, ${tint}88)`,
          color: "rgba(0,0,0,0.62)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.35)",
        }}
      >
        {doc.title.replace(/[^A-Za-z]/g, "").slice(0, 2)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className={`font-medium ${isPoppedOut ? "text-[14px]" : "text-[11px]"}`} style={{ color: OS.txt }}>
            {doc.title}
          </span>
          <span className={`truncate font-mono ${isPoppedOut ? "text-[10px]" : "text-[8px]"}`} style={{ color: OS.faint }}>
            {doc.context}
          </span>
        </span>
        <span className={`block truncate ${isPoppedOut ? "mt-0.5 text-[12px]" : "mt-0.5 text-[10px]"}`} style={{ color: OS.dim }}>
          {doc.tagline}
        </span>
      </span>
      <span className={`shrink-0 font-mono ${isPoppedOut ? "text-[10px]" : "text-[8px]"}`} style={{ color: OS.faint }}>
        {doc.period}
      </span>
      <span
        className={`shrink-0 opacity-0 transition-opacity group-hover:opacity-100 ${isPoppedOut ? "text-[12px]" : "text-[10px]"}`}
        style={{ color: OS.accent }}
      >
        →
      </span>
    </button>
  );
}
