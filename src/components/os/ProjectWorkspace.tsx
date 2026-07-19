"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  isTodo,
  MILESTONE_BY_ID,
  PROJECT_DOCS,
  todoHint,
  type MilestoneId,
  type ProjectId,
} from "@/content/work";
import { DUR, EASE } from "@/lib/design";
import { ArchDiagram } from "./ArchDiagram";
import { useOSRouter } from "./OSRouter";
import { OS } from "./theme";
import { Prose, TodoNote } from "./TodoNote";

/**
 * A project as an engineering workspace, not a card.
 *
 * Left rail lists the sections of the case study and tracks where you
 * are as you scroll; the right pane is one continuous document. That
 * split is what makes nine sections legible on a 1152×448 panel — the
 * rail gives you the shape of the whole thing while the pane only ever
 * shows one part of it.
 *
 * Every project ends in cross-links: the milestone it belongs to, and
 * the projects worth reading next. You should never hit a dead end.
 */

/** how many headline tech chips the summary shows before it stops */
const SUMMARY_TECH = 5;
/** how many outcomes the summary shows before it stops */
const SUMMARY_RESULTS = 3;

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "problem", label: "Problem" },
  { id: "architecture", label: "Architecture" },
  { id: "challenges", label: "Challenges" },
  { id: "stack", label: "Tech Stack" },
  { id: "results", label: "Results" },
  { id: "lessons", label: "Lessons" },
  { id: "timeline", label: "Timeline" },
  { id: "links", label: "Links" },
] as const;

export function ProjectWorkspace({ id }: { id: ProjectId }) {
  const doc = PROJECT_DOCS[id];
  const paneRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string>("overview");

  // jumping to a section scrolls the pane, not the page
  const jump = useCallback((sectionId: string) => {
    const pane = paneRef.current;
    const el = pane?.querySelector<HTMLElement>(`[data-section="${sectionId}"]`);
    if (!pane || !el) return;
    pane.scrollTo({ top: el.offsetTop - 8, behavior: "smooth" });
    setActive(sectionId);
  }, []);

  // scroll spy — whichever section header is nearest the top of the pane
  useEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;
    const onScroll = () => {
      const marks = Array.from(pane.querySelectorAll<HTMLElement>("[data-section]"));
      let current = marks[0]?.dataset.section ?? "overview";
      for (const m of marks) {
        if (m.offsetTop - 24 <= pane.scrollTop) current = m.dataset.section!;
      }
      setActive(current);
    };
    pane.addEventListener("scroll", onScroll, { passive: true });
    return () => pane.removeEventListener("scroll", onScroll);
  }, [id]);

  // a new project reuses the same pane — start it at the top
  useEffect(() => {
    paneRef.current?.scrollTo({ top: 0 });
    setActive("overview");
  }, [id]);

  return (
    <div className="flex min-h-0 flex-1">
      {/* left rail — the shape of the whole document */}
      <nav
        className="os-scroll w-[124px] shrink-0 overflow-y-auto border-r px-2 py-2.5"
        style={{ borderColor: OS.lineSoft, background: "rgba(0,0,0,0.15)" }}
      >
        <p className="px-1.5 font-mono text-[7.5px] tracking-[0.22em] uppercase" style={{ color: OS.faint }}>
          Case study
        </p>
        <div className="mt-1.5 flex flex-col gap-[1px]">
          {SECTIONS.map((s) => {
            const on = active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => jump(s.id)}
                className="rounded px-1.5 py-[3px] text-left text-[10px] transition-colors"
                style={{
                  background: on ? "rgba(255,255,255,0.07)" : "transparent",
                  color: on ? OS.txt : OS.dim,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 border-t pt-2" style={{ borderColor: OS.lineSoft }}>
          <p className="px-1.5 font-mono text-[7.5px] tracking-[0.22em] uppercase" style={{ color: OS.faint }}>
            Chapter
          </p>
          <MilestoneChip id={doc.milestone} />
        </div>
      </nav>

      {/* the document */}
      <div ref={paneRef} className="os-scroll min-w-0 flex-1 overflow-y-auto px-4 py-3">
        <motion.div
          key={id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.ui, ease: EASE.out }}
        >
          {/* masthead */}
          <header>
            <div className="flex items-baseline gap-2">
              <h1 className="text-[15px] font-medium tracking-tight" style={{ color: OS.txt }}>
                {doc.title}
              </h1>
              <span className="font-mono text-[9px]" style={{ color: OS.faint }}>
                {doc.period}
              </span>
            </div>
            <p className="mt-0.5 text-[10.5px]" style={{ color: OS.dim }}>
              {doc.role} · {doc.context}
            </p>
          </header>

          <SummaryCard doc={doc} />

          <Section id="overview" label="Overview">
            <Prose text={doc.overview} />
          </Section>

          <Section id="problem" label="Problem">
            <Prose text={doc.problem} />
          </Section>

          <Section id="architecture" label="Architecture">
            <Prose text={doc.architecture.summary} />
            {doc.architecture.diagram && (
              <div className="mt-2.5">
                <ArchDiagram spec={doc.architecture.diagram} />
              </div>
            )}
          </Section>

          <Section id="challenges" label="Engineering Challenges">
            <div className="flex flex-col gap-2.5">
              {doc.challenges.map((c) => (
                <article key={c.title}>
                  <h3 className="text-[11px] font-medium" style={{ color: OS.txt }}>
                    {c.title}
                  </h3>
                  <div className="mt-1">
                    <Prose text={c.body} />
                  </div>
                </article>
              ))}
            </div>
          </Section>

          <Section id="stack" label="Tech Stack">
            <div className="flex flex-col gap-2">
              {doc.stack.map((g) => (
                <div key={g.group}>
                  <p className="font-mono text-[7.5px] tracking-[0.2em] uppercase" style={{ color: OS.faint }}>
                    {g.group}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {g.items.map((t) => (
                      <span
                        key={t}
                        className="rounded-md px-1.5 py-0.5 font-mono text-[9px]"
                        style={{ background: OS.raised, border: `1px solid ${OS.line}`, color: OS.dim }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="results" label="Results">
            <Bullets items={doc.results} tint={OS.accent} />
          </Section>

          <Section id="lessons" label="Lessons Learned">
            <Bullets items={doc.lessons} tint="#a8b48c" />
          </Section>

          <Section id="timeline" label="Timeline">
            <ol className="flex flex-col gap-1.5">
              {doc.timeline.map((t) => (
                <li key={t.when + t.what} className="flex gap-2.5">
                  <span
                    className="w-[86px] shrink-0 font-mono text-[9px] leading-relaxed"
                    style={{ color: OS.faint }}
                  >
                    {t.when}
                  </span>
                  <span className="text-[11px] leading-relaxed" style={{ color: OS.txt }}>
                    {t.what}
                  </span>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="links" label="Links">
            <div className="flex flex-wrap gap-1.5">
              {doc.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md px-2 py-1 font-mono text-[9px] transition-colors hover:bg-white/10"
                  style={{ background: OS.raised, border: `1px solid ${OS.line}`, color: OS.dim }}
                >
                  {l.label} ↗
                </a>
              ))}
            </div>
          </Section>

          {/* never a dead end */}
          {doc.related.length > 0 && (
            <div className="mt-4 border-t pt-2.5" style={{ borderColor: OS.lineSoft }}>
              <p className="font-mono text-[7.5px] tracking-[0.22em] uppercase" style={{ color: OS.faint }}>
                Read next
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {doc.related.map((r) => (
                  <RelatedChip key={r} id={r} />
                ))}
              </div>
            </div>
          )}
          <div className="h-2" />
        </motion.div>
      </div>
    </div>
  );
}

/**
 * The 30-second read.
 *
 * Three audiences land on this page and only one of them scrolls. A
 * recruiter needs what-it-is, what-you-used and what-came-of-it without
 * touching the wheel; the sections below are for the people who dig.
 * So this card is deliberately the same few facts already in the
 * document — surfaced, not added.
 *
 * Results are the first few from the doc, which is why the ordering of
 * `results` in work.ts matters: put the number you'd lead with first.
 * TODO markers are skipped rather than shown as gaps — this block is a
 * shop window, and the honest gap still renders in the section below.
 */
function SummaryCard({ doc }: { doc: (typeof PROJECT_DOCS)[ProjectId] }) {
  const tech = doc.stack.flatMap((g) => g.items).slice(0, SUMMARY_TECH);
  const headline = doc.results.filter((r) => !isTodo(r)).slice(0, SUMMARY_RESULTS);

  return (
    <div
      className="mt-2.5 rounded-lg px-2.5 py-2"
      style={{ background: OS.sunk, border: `1px solid ${OS.line}` }}
    >
      <p className="text-[11px] leading-snug" style={{ color: OS.txt }}>
        {doc.tagline}
      </p>

      <div className="mt-1.5 flex flex-wrap gap-1">
        {tech.map((t) => (
          <span
            key={t}
            className="rounded px-1.5 py-[1px] font-mono text-[8.5px]"
            style={{ background: OS.raised, border: `1px solid ${OS.line}`, color: OS.dim }}
          >
            {t}
          </span>
        ))}
      </div>

      {headline.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {headline.map((r) => (
            <li
              key={r}
              className="flex gap-1.5 text-[10px] leading-snug"
              style={{ color: OS.dim }}
            >
              <span
                className="mt-[6px] h-[3px] w-[3px] shrink-0 rounded-full"
                style={{ background: OS.accent }}
              />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Section({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <section data-section={id} className="mt-4 scroll-mt-2">
      <h2
        className="mb-1.5 font-mono text-[8px] tracking-[0.24em] uppercase"
        style={{ color: OS.accent }}
      >
        {label}
      </h2>
      {children}
    </section>
  );
}

function Bullets({ items, tint }: { items: string[]; tint: string }) {
  if (items.length === 0) {
    return (
      <p className="text-[10.5px] italic" style={{ color: OS.faint }}>
        Nothing recorded for this chapter yet.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((b) =>
        isTodo(b) ? (
          <li key={b}>
            <TodoNote hint={todoHint(b)} />
          </li>
        ) : (
          <li key={b} className="flex gap-2 text-[11px] leading-relaxed" style={{ color: OS.txt }}>
            <span className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full" style={{ background: tint }} />
            <span>{b}</span>
          </li>
        ),
      )}
    </ul>
  );
}

/** jumps back into the Timeline with this project's chapter expanded */
function MilestoneChip({ id }: { id: MilestoneId }) {
  const { openMilestone } = useOSRouter();
  const m = MILESTONE_BY_ID[id];
  if (!m) return null;
  return (
    <button
      onClick={() => openMilestone(m.id)}
      className="mt-1 flex w-full items-start gap-1.5 rounded px-1.5 py-1 text-left transition-colors hover:bg-white/5"
    >
      <span className="font-mono text-[8px] leading-[1.5] tabular-nums" style={{ color: OS.faint }}>
        {m.glyph}
      </span>
      <span className="text-[9.5px] leading-tight" style={{ color: OS.dim }}>
        {m.chapter}
      </span>
    </button>
  );
}

function RelatedChip({ id }: { id: ProjectId }) {
  const { openProject } = useOSRouter();
  const doc = PROJECT_DOCS[id];
  return (
    <button
      onClick={() => openProject(id)}
      className="rounded-md px-2 py-1 text-left transition-colors hover:bg-white/10"
      style={{ background: OS.raised, border: `1px solid ${OS.line}` }}
    >
      <span className="text-[10px]" style={{ color: OS.txt }}>
        {doc.title}
      </span>
      <span className="ml-1.5 font-mono text-[8px]" style={{ color: OS.faint }}>
        {doc.context.split(" · ")[0]}
      </span>
    </button>
  );
}
