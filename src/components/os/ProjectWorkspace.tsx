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
import { useOSDesktop } from "@/components/objects/MonitorScreen";

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
  const { isPoppedOut } = useOSDesktop();

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
      {/* section rail */}
      <nav
        className={`shrink-0 border-r ${isPoppedOut ? "w-[260px] p-5" : "w-[128px] p-2"}`}
        style={{ borderColor: OS.line, background: OS.sunk }}
      >
        <p className={`px-1.5 font-mono uppercase ${isPoppedOut ? "text-[10px] tracking-[0.24em] mb-2" : "text-[7.5px] tracking-[0.22em]"}`} style={{ color: OS.faint }}>
          In this doc
        </p>
        <ul className="mt-1 flex flex-col gap-0.5">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => jump(s.id)}
                className={`w-full rounded text-left transition-colors ${
                  isPoppedOut ? "px-3 py-2 text-[15px]" : "px-1.5 py-[3px] text-[10px]"
                }`}
                style={{
                  background: active === s.id ? "rgba(255,255,255,0.08)" : "transparent",
                  color: active === s.id ? OS.txt : OS.dim,
                }}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="my-2.5 h-px" style={{ background: OS.line }} />

        <p className={`px-1.5 font-mono uppercase ${isPoppedOut ? "text-[10px] tracking-[0.24em] mb-1.5" : "text-[7.5px] tracking-[0.22em]"}`} style={{ color: OS.faint }}>
          Context
        </p>
        <MilestoneChip id={doc.milestone} />

        {doc.related.length > 0 && (
          <>
            <div className="my-2.5 h-px" style={{ background: OS.line }} />
            <p className={`px-1.5 font-mono uppercase ${isPoppedOut ? "text-[10px] tracking-[0.24em] mb-1.5" : "text-[7.5px] tracking-[0.22em]"}`} style={{ color: OS.faint }}>
              Related
            </p>
            <div className="mt-1 flex flex-col gap-1">
              {doc.related.map((r) => (
                <RelatedChip key={r} id={r} />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* the document */}
      <div ref={paneRef} className={`os-scroll min-w-0 flex-1 overflow-y-auto ${isPoppedOut ? "px-12 py-10" : "px-4 py-3"}`}>
        <motion.div
          key={id}
          className={isPoppedOut ? "mx-auto max-w-4xl" : ""}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.ui, ease: EASE.out }}
        >
          {/* masthead */}
          <header>
            <div className="flex items-baseline gap-2">
              <h1 className={`font-medium tracking-tight ${isPoppedOut ? "text-[22px] md:text-[24px]" : "text-[15px]"}`} style={{ color: OS.txt }}>
                {doc.title}
              </h1>
              <span className={`font-mono ${isPoppedOut ? "text-[12px]" : "text-[9px]"}`} style={{ color: OS.faint }}>
                {doc.period}
              </span>
            </div>
            <p className={`mt-0.5 ${isPoppedOut ? "text-[14px] mt-1" : "text-[10.5px]"}`} style={{ color: OS.dim }}>
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
            <div className={isPoppedOut ? "flex flex-col gap-4" : "flex flex-col gap-2.5"}>
              {doc.challenges.map((c) => (
                <article key={c.title}>
                  <h3 className={`font-medium ${isPoppedOut ? "text-[15px]" : "text-[11px]"}`} style={{ color: OS.txt }}>
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
            <div className={isPoppedOut ? "flex flex-col gap-3" : "flex flex-col gap-2"}>
              {doc.stack.map((g) => (
                <div key={g.group}>
                  <p className={`font-mono uppercase ${isPoppedOut ? "text-[10px] tracking-[0.22em]" : "text-[7.5px] tracking-[0.2em]"}`} style={{ color: OS.faint }}>
                    {g.group}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {g.items.map((t) => (
                      <span
                        key={t}
                        className={`rounded-md font-mono ${isPoppedOut ? "px-2.5 py-1 text-[11.5px]" : "px-1.5 py-0.5 text-[9px]"}`}
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
            <ol className={isPoppedOut ? "flex flex-col gap-2.5" : "flex flex-col gap-1.5"}>
              {doc.timeline.map((t) => (
                <li key={t.when + t.what} className="flex gap-3">
                  <span
                    className={`shrink-0 font-mono leading-relaxed ${isPoppedOut ? "w-[110px] text-[11.5px]" : "w-[86px] text-[9px]"}`}
                    style={{ color: OS.faint }}
                  >
                    {t.when}
                  </span>
                  <span className={`leading-relaxed ${isPoppedOut ? "text-[13.5px] md:text-[14px]" : "text-[11px]"}`} style={{ color: OS.txt }}>
                    {t.what}
                  </span>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="links" label="Links">
            <div className="flex flex-wrap gap-2">
              {doc.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded-md font-mono transition-colors hover:bg-white/10 ${
                    isPoppedOut ? "px-3 py-1.5 text-[11px]" : "px-2 py-1 text-[9px]"
                  }`}
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
              <p className={`font-mono uppercase ${isPoppedOut ? "text-[12px] tracking-[0.24em] mb-3" : "text-[7.5px] tracking-[0.22em]"}`} style={{ color: OS.faint }}>
                Read next
              </p>
              <div className={`mt-1.5 flex flex-wrap ${isPoppedOut ? "gap-2.5" : "gap-1.5"}`}>
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
  const { isPoppedOut } = useOSDesktop();

  return (
    <div
      className={`mt-2.5 rounded-lg ${isPoppedOut ? "px-5 py-4" : "px-2.5 py-2"}`}
      style={{ background: OS.sunk, border: `1px solid ${OS.line}` }}
    >
      <p className={`leading-snug ${isPoppedOut ? "text-[16px]" : "text-[11px]"}`} style={{ color: OS.txt }}>
        {doc.tagline}
      </p>

      <div className={`mt-1.5 flex flex-wrap ${isPoppedOut ? "gap-2" : "gap-1"}`}>
        {tech.map((t) => (
          <span
            key={t}
            className={`rounded font-mono ${isPoppedOut ? "px-2 py-0.5 text-[12px]" : "px-1.5 py-[1px] text-[8.5px]"}`}
            style={{ background: OS.raised, border: `1px solid ${OS.line}`, color: OS.dim }}
          >
            {t}
          </span>
        ))}
      </div>

      {headline.length > 0 && (
        <ul className={`flex flex-col ${isPoppedOut ? "mt-4 gap-2" : "mt-2 gap-1"}`}>
          {headline.map((r) => (
            <li
              key={r}
              className={`flex leading-snug ${isPoppedOut ? "gap-2 text-[14px]" : "gap-1.5 text-[10px]"}`}
              style={{ color: OS.dim }}
            >
              <span
                className={`shrink-0 rounded-full ${isPoppedOut ? "mt-[7px] h-[5px] w-[5px]" : "mt-[6px] h-[3px] w-[3px]"}`}
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
  const { isPoppedOut } = useOSDesktop();
  return (
    <section data-section={id} className={`${isPoppedOut ? "mt-8 scroll-mt-6" : "mt-4 scroll-mt-2"}`}>
      <h2
        className={`font-mono uppercase ${isPoppedOut ? "mb-3 text-[14px] tracking-[0.2em]" : "mb-1.5 text-[8px] tracking-[0.24em]"}`}
        style={{ color: OS.accent }}
      >
        {label}
      </h2>
      {children}
    </section>
  );
}

function Bullets({ items, tint }: { items: string[]; tint: string }) {
  const { isPoppedOut } = useOSDesktop();
  if (items.length === 0) {
    return (
      <p className={`italic ${isPoppedOut ? "text-[14px]" : "text-[10.5px]"}`} style={{ color: OS.faint }}>
        Nothing recorded for this chapter yet.
      </p>
    );
  }
  return (
    <ul className={`flex flex-col ${isPoppedOut ? "gap-2.5" : "gap-1.5"}`}>
      {items.map((b) =>
        isTodo(b) ? (
          <li key={b}>
            <TodoNote hint={todoHint(b)} />
          </li>
        ) : (
          <li key={b} className={`flex leading-relaxed ${isPoppedOut ? "gap-3 text-[14.5px] md:text-[15px]" : "gap-2 text-[11px]"}`} style={{ color: OS.txt }}>
            <span className={`shrink-0 rounded-full ${isPoppedOut ? "mt-[9px] h-[5px] w-[5px]" : "mt-[7px] h-[3px] w-[3px]"}`} style={{ background: tint }} />
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
  const { isPoppedOut } = useOSDesktop();
  if (!m) return null;
  return (
    <button
      onClick={() => openMilestone(m.id)}
      className={`mt-1 flex w-full items-start rounded text-left transition-colors hover:bg-white/5 ${isPoppedOut ? "gap-2.5 px-3 py-2" : "gap-1.5 px-1.5 py-1"}`}
    >
      <span className={`font-mono tabular-nums ${isPoppedOut ? "text-[12px] leading-[1.5]" : "text-[8px] leading-[1.5]"}`} style={{ color: OS.faint }}>
        {m.glyph}
      </span>
      <span className={`leading-tight ${isPoppedOut ? "text-[14px]" : "text-[9.5px]"}`} style={{ color: OS.dim }}>
        {m.chapter}
      </span>
    </button>
  );
}

function RelatedChip({ id }: { id: ProjectId }) {
  const { openProject } = useOSRouter();
  const doc = PROJECT_DOCS[id];
  const { isPoppedOut } = useOSDesktop();
  return (
    <button
      onClick={() => openProject(id)}
      className={`rounded-md text-left transition-colors hover:bg-white/10 ${isPoppedOut ? "px-3 py-2" : "px-2 py-1"}`}
      style={{ background: OS.raised, border: `1px solid ${OS.line}` }}
    >
      <span className={isPoppedOut ? "text-[14px]" : "text-[10px]"} style={{ color: OS.txt }}>
        {doc.title}
      </span>
      <span className={`font-mono ${isPoppedOut ? "ml-2.5 text-[11px]" : "ml-1.5 text-[8px]"}`} style={{ color: OS.faint }}>
        {doc.context.split(" · ")[0]}
      </span>
    </button>
  );
}
