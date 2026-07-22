"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  isTodo,
  MILESTONES,
  PROJECT_DOCS,
  todoHint,
  TRAINING_LOG,
  type MilestoneId,
  type ProjectId,
} from "@/content/work";
import { DUR, EASE } from "@/lib/design";
import { useOSRouter } from "./OSRouter";
import { OSWindow } from "./OSWindow";
import { OS } from "./theme";
import { Prose, TodoNote } from "./TodoNote";
import { useOSDesktop } from "@/components/objects/MonitorScreen";

/**
 * TIMELINE — the career as chapters, not dates.
 *
 * A list of years tells you when things happened. This is organised so
 * each row answers the only question that matters: what did I become
 * after this? The date is secondary metadata; the "became" line is the
 * headline.
 *
 * Nothing navigates away. A chapter expands in place — accordion, one
 * open at a time — so you never lose the shape of the whole arc while
 * reading one piece of it. The projects inside a chapter are live: they
 * open the Projects app on that case study, which links back here.
 */

export function TimelineApp({
  onClose,
  onFocus,
  zIndex,
  expanded,
  onExpand,
}: {
  onClose: () => void;
  onFocus: () => void;
  zIndex: number;
  /** driven from the desktop so project pages can jump to a chapter */
  expanded: MilestoneId | null;
  onExpand: (id: MilestoneId | null) => void;
}) {
  const paneRef = useRef<HTMLDivElement>(null);
  const { isPoppedOut } = useOSDesktop();

  // Clicking a chapter here must not move the page under your cursor —
  // only arriving from a project's "chapter" link should scroll.
  //
  // Both cases change `expanded`, so the effect below can't tell them
  // apart on its own; this flag marks the ones you caused yourself.
  const selfToggled = useRef(false);
  const toggle = (id: MilestoneId | null) => {
    selfToggled.current = true;
    onExpand(id);
  };

  useEffect(() => {
    if (selfToggled.current) {
      selfToggled.current = false;
      return;
    }
    if (!expanded) return;

    // Wait for the accordion to settle first. Measuring immediately reads
    // offsetTop from a layout that still includes the chapter currently
    // collapsing above — scroll to that and you land past the end of the
    // shorter content that's left.
    const t = window.setTimeout(() => {
      const pane = paneRef.current;
      const el = pane?.querySelector<HTMLElement>(`[data-chapter="${expanded}"]`);
      if (!pane || !el) return;
      pane.scrollTo({ top: Math.max(0, el.offsetTop - 8), behavior: "smooth" });
    }, DUR.tap * 1000 + 40);

    return () => window.clearTimeout(t);
  }, [expanded]);

  return (
    <OSWindow
      title="Timeline — The Story"
      onClose={onClose}
      onFocus={onFocus}
      defaultMaximized
      style={{ width: isPoppedOut ? "min(92vw, 1280px)" : 760, left: isPoppedOut ? "50%" : 120, transform: isPoppedOut ? "translateX(-50%)" : undefined, top: isPoppedOut ? 30 : 20, zIndex }}
    >
      <div ref={paneRef} className={`os-scroll flex-1 overflow-y-auto ${isPoppedOut ? "px-12 py-10" : "px-4 py-3"}`}>
        <div className={isPoppedOut ? "mx-auto max-w-4xl" : ""}>
          <header className="mb-4">
            <h1 className={`font-medium tracking-tight ${isPoppedOut ? "text-[18px] md:text-[20px]" : "text-[12px]"}`} style={{ color: OS.txt }}>
              Timeline
            </h1>
            <p className={`mt-0.5 ${isPoppedOut ? "text-[13.5px] mt-1" : "text-[10px]"}`} style={{ color: OS.dim }}>
              {TRAINING_LOG.provenance}
            </p>
          </header>

          <ol className="flex flex-col">
            {MILESTONES.map((m, i) => (
              <MilestoneRow
                key={m.id}
                m={m}
                index={i}
                last={i === MILESTONES.length - 1}
                open={expanded === m.id}
                onToggle={() => toggle(expanded === m.id ? null : m.id)}
                isPoppedOut={isPoppedOut}
              />
            ))}
          </ol>

          <footer className={`mt-6 border-t pt-3 border-white/5`}>
            <p className={`font-mono uppercase ${isPoppedOut ? "text-[10px] tracking-[0.24em] mb-1.5" : "text-[7.5px] tracking-[0.22em]"}`} style={{ color: OS.faint }}>
              Provenance
            </p>
            <p className={isPoppedOut ? "text-[12.5px] leading-relaxed" : "text-[10px] leading-relaxed"} style={{ color: OS.dim }}>
              Every entry maps to a public repo, a recorded run, or a domain shipped for a client. Nothing is generated at render time.
            </p>
          </footer>
        </div>
      </div>
    </OSWindow>
  );
}

function MilestoneRow({
  m,
  index,
  last,
  open,
  onToggle,
  isPoppedOut,
}: {
  m: (typeof MILESTONES)[number];
  index: number;
  last: boolean;
  open: boolean;
  onToggle: () => void;
  isPoppedOut: boolean;
}) {
  return (
    <li data-chapter={m.id} className="flex gap-3">
      <div className="flex flex-col items-center">
        <span
          className={`rounded-full transition-colors ${isPoppedOut ? "mt-2.5 h-3.5 w-3.5" : "mt-2 h-2.5 w-2.5"}`}
          style={{ background: open ? OS.accent : OS.dim, border: `2px solid #1a1816` }}
        />
        {!last && <span className="w-px flex-1" style={{ background: OS.line }} />}
      </div>

      <div className="min-w-0 flex-1 pb-1">
        <motion.button
          onClick={onToggle}
          className="w-full rounded-md px-2 py-2 text-left transition-colors hover:bg-white/[0.04]"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04, duration: DUR.ui, ease: EASE.out }}
        >
          <div className="flex items-baseline gap-2">
            <span
              className={`font-mono tabular-nums ${isPoppedOut ? "text-[12px]" : "text-[9px]"}`}
              style={{ color: open ? OS.accent : OS.faint }}
            >
              {m.glyph}
            </span>
            <span className={`font-medium ${isPoppedOut ? "text-[15px] md:text-[16px]" : "text-[11.5px]"}`} style={{ color: OS.txt }}>
              {m.chapter}
            </span>
            <span className={`font-mono ${isPoppedOut ? "text-[11px]" : "text-[8.5px]"}`} style={{ color: OS.faint }}>
              {m.period}
            </span>
            <span
              className={`ml-auto transition-transform ${isPoppedOut ? "text-[12px]" : "text-[9px]"}`}
              style={{ color: OS.faint, transform: open ? "rotate(90deg)" : "none" }}
            >
              ›
            </span>
          </div>
          {isTodo(m.became) ? (
            <div className="mt-1.5">
              <TodoNote hint={todoHint(m.became)} />
            </div>
          ) : (
            <p className={`mt-1 leading-snug ${isPoppedOut ? "text-[13.5px] md:text-[14px]" : "text-[10.5px]"}`} style={{ color: open ? OS.accent : OS.dim }}>
              {m.became}
            </p>
          )}
        </motion.button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: DUR.tap, ease: EASE.out }}
              className="overflow-hidden"
            >
              <div className="px-2 pt-1 pb-3">
                <Prose text={m.summary} />

                {m.projects.length > 0 && (
                  <Block label="Projects completed" isPoppedOut={isPoppedOut}>
                    <div className="flex flex-wrap gap-1.5">
                      {m.projects.map((p) => (
                        <ProjectLink key={p} id={p} />
                      ))}
                    </div>
                  </Block>
                )}

                {m.alsoShipped.length > 0 && (
                  <Block label="Also in this chapter" isPoppedOut={isPoppedOut}>
                    <ul className="flex flex-col gap-1">
                      {m.alsoShipped.map((s) =>
                        isTodo(s) ? (
                          <li key={s}>
                            <TodoNote hint={todoHint(s)} />
                          </li>
                        ) : (
                          <li
                            key={s}
                            className={`flex gap-2 leading-relaxed ${isPoppedOut ? "text-[13px] md:text-[14px]" : "text-[10.5px]"}`}
                            style={{ color: OS.dim }}
                          >
                            <span
                              className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full"
                              style={{ background: OS.faint }}
                            />
                            <span>{s}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </Block>
                )}

                <Block label="Technologies" isPoppedOut={isPoppedOut}>
                  <div className="flex flex-wrap gap-1">
                    {m.tech.map((t) => (
                      <span
                        key={t}
                        className={`rounded font-mono ${isPoppedOut ? "px-2 py-0.5 text-[11px]" : "px-1.5 py-0.5 text-[8.5px]"}`}
                        style={{ background: OS.raised, border: `1px solid ${OS.line}`, color: OS.dim }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </Block>

                {m.lessons.length > 0 && (
                  <Block label="Engineering lessons" isPoppedOut={isPoppedOut}>
                    <ul className="flex flex-col gap-1">
                      {m.lessons.map((l) => (
                        <li
                          key={l}
                          className={`flex gap-2 leading-relaxed ${isPoppedOut ? "text-[13px] md:text-[14px]" : "text-[10.5px]"}`}
                          style={{ color: OS.txt }}
                        >
                          <span
                            className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full"
                            style={{ background: "#a8b48c" }}
                          />
                          <span>{l}</span>
                        </li>
                      ))}
                    </ul>
                  </Block>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </li>
  );
}

function Block({ label, children, isPoppedOut = false }: { label: string; children: React.ReactNode; isPoppedOut?: boolean }) {
  return (
    <div className="mt-3">
      <p className={`mb-1 font-mono uppercase ${isPoppedOut ? "text-[10px] tracking-[0.24em]" : "text-[7.5px] tracking-[0.22em]"}`} style={{ color: OS.faint }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function ProjectLink({ id }: { id: ProjectId }) {
  const { openProject } = useOSRouter();
  const doc = PROJECT_DOCS[id];
  return (
    <button
      onClick={() => openProject(id)}
      className="group rounded-md px-2 py-1 text-left transition-colors hover:bg-white/10"
      style={{ background: OS.raised, border: `1px solid ${OS.line}` }}
    >
      <span className="text-[10px]" style={{ color: OS.txt }}>
        {doc.title}
      </span>
      <span className="ml-1.5 font-mono text-[8px]" style={{ color: OS.faint }}>
        {doc.tier}
      </span>
    </button>
  );
}

function OpenCaseStudy({ id }: { id: ProjectId }) {
  const { openProject } = useOSRouter();
  return (
    <button
      onClick={() => openProject(id)}
      className="mt-3 rounded-md px-2.5 py-1 font-mono text-[9px] transition-colors"
      style={{
        background: "rgba(255,179,97,0.10)",
        border: "1px solid rgba(255,179,97,0.28)",
        color: OS.accent,
      }}
    >
      Open case study — {PROJECT_DOCS[id].title} →
    </button>
  );
}
