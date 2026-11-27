import type { Metadata } from "next";
import Link from "next/link";
import {
  ACHIEVEMENTS,
  EDUCATION,
  EXPERIENCE,
  OPEN_SOURCE,
  PROFILE,
  SKILLS,
} from "@/content/portfolio";
import {
  ARCHIVE,
  FEATURED,
  PROJECT_DOCS,
  isTodo,
  type ProjectDoc,
  type ProjectId,
} from "@/content/work";
import { MaskTitle, Reveal, TransitionLink } from "@/components/brief/motion";
import { CopyEmail } from "@/components/brief/chrome";
import { Schematic } from "@/components/brief/schematic";
import { Clip, PopGroup, PopUp } from "@/components/brief/media";
import { MatrixSpotlightBackground } from "@/components/brief/cursor";

/**
 * /brief — the room, flattened into one readable page.
 *
 * Same content as the 3D workspace (it reads the same content files, so
 * the two can never drift), laid out for the visitor who has thirty
 * seconds, a phone, or no WebGL.
 *
 * Design rule for this page: white paper, two typefaces (Inter Tight for
 * display, Inter for text), one ink colour and a grey. No icons, no
 * gradients, no handwriting, no glow. Hierarchy comes from size and
 * space alone, and the only imagery is real: the room, the recorded
 * demo, and each project's own architecture graph.
 *
 * Server-rendered: none of three.js ships here.
 */

export const metadata: Metadata = {
  title: "Ritankar Mondal | AI Engineer",
  description: PROFILE.summary,
  alternates: { canonical: "/brief" },
  openGraph: {
    title: "Ritankar Mondal | AI Engineer",
    description: PROFILE.summary,
    type: "profile",
  },
};

/**
 * The four projects that get a full spread. Each cover figure is lifted
 * verbatim from that project's `results` in work.ts — this list selects
 * and shortens, it never computes or rounds. If a source line changes,
 * change the cover with it.
 */
const SPOTLIGHT: {
  id: ProjectId;
  figure: string;
  caption: string;
  tone: "paper" | "ink" | "photo";
}[] = [
  {
    id: "desi-agent",
    figure: "45.9% → 97.7%",
    caption: "Task success on 486 held-out banking conversations",
    tone: "paper",
  },
  {
    id: "ancora",
    figure: "~60s → ~6s",
    caption: "Time to detect a killed worker",
    tone: "photo",
  },
  {
    id: "senpai",
    figure: "11 → 55 tok/s",
    caption: "Inference throughput, via prefix and context caching",
    tone: "ink",
  },
  {
    id: "toolcalllm",
    figure: "97%",
    caption: "BFCL accuracy on single-turn function calling",
    tone: "paper",
  },
];

const SPOTLIT = new Set(SPOTLIGHT.map((s) => s.id));
const MORE: ProjectId[] = [...FEATURED, ...ARCHIVE].filter(
  (id) => !SPOTLIT.has(id),
);

const GITHUB_URL = `https://github.com/${PROFILE.github}`;
const REPO_ROOT = new RegExp(
  `^https://github\\.com/${PROFILE.github}/([^/#?]+)/?$`,
  "i",
);
const repoOf = (p: ProjectDoc) => p.links.find((l) => REPO_ROOT.test(l.href));
const liveOf = (p: ProjectDoc) =>
  p.links.find((l) => /live/i.test(l.label) && !isTodo(l.href));
const youtubeUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

const MERGED = OPEN_SOURCE.filter((c) => c.merged);
/** "docling-serve" and "Docling" are one upstream: Docling */
const upstreamOf = (project: string) => {
  const base = project.split("-")[0];
  return base[0].toUpperCase() + base.slice(1);
};
const UPSTREAMS = [...new Set(MERGED.map((c) => upstreamOf(c.project)))];
const UPSTREAMS_ALL = [
  ...new Set(OPEN_SOURCE.map((c) => upstreamOf(c.project))),
];

const monthName = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${y}`;
};

/** "May 2026 – Jul 2026" → "2026"; "Feb 2026 – May 2026" → "2026" */
const years = (period: string) => {
  const ys = [...new Set(period.match(/\d{4}/g) ?? [])];
  return ys.join(" – ");
};

const list = (xs: string[]) =>
  xs.length < 2
    ? xs.join("")
    : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

export default function BriefPage() {
  return (
    <main id="top">
      <Hero />
      <Showcase />
      <Work />
      <About />
      <OpenSource />
      <Recognition />
      <Stack />
      <Contact />
    </main>
  );
}

/* ------------------------------------------------------------------ */

function Hero() {
  const [latest, ...earlier] = EXPERIENCE;
  return (
    <section className="b-hero">
      <MatrixSpotlightBackground />
      <div className="b-wrap b-hero-inner">
        <h1 className="b-display b-hero-title">
          <MaskTitle as="span" immediate delay={0.05}>
            AI Engineer
          </MaskTitle>
        </h1>

        <div className="b-hero-grid">
          <Reveal immediate delay={0.35} className="b-hero-meta">
            <dl>
              <div>
                <dt>Now</dt>
                <dd>Final year, IIT Madras</dd>
              </div>
              <div>
                <dt>Latest</dt>
                <dd>
                  {latest.company}, {latest.location.split(" · ")[0]}
                </dd>
              </div>
              <div>
                <dt>Before</dt>
                <dd>{earlier.map((r) => r.company).join(", ")}</dd>
              </div>
            </dl>
          </Reveal>

          <Reveal immediate delay={0.25} className="b-hero-copy">
            <p>
              I fine-tune, benchmark and serve LLMs, and build the
              fault-tolerant systems underneath them. Most recently that meant
              tool-calling models at {latest.company} in Tokyo.
            </p>
            <p>
              Ten months across four industry internships, and {MERGED.length}{" "}
              merged pull requests upstream in {list(UPSTREAMS)}.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/**
 * The showcase: three real recordings rising into a black panel one
 * after another, after the reference site's phone mockups. The room tour
 * was recorded from the live 3D site; the two Ancora clips are cut from
 * its YouTube demo.
 */
function Showcase() {
  return (
    <section className="b-wrap" aria-label="Recordings">
      <Reveal immediate delay={0.4}>
        <PopGroup className="b-showcase">
          <PopUp className="b-shot b-shot-main" delay={0.15} distance={160} grouped>
            <Link href="/" className="b-shot-link" data-cursor="ENTER ROOM">
              <Clip
                src="/brief/clips/room-tour.mp4"
                poster="/brief/clips/room-tour.jpg"
                label="A flight through the 3D room: the desk, the monitor, the whiteboard"
                className="b-shot-media"
              />
              <span className="b-tag b-shot-tag">
                The 3D room, recorded live
              </span>
            </Link>
          </PopUp>
          <PopUp className="b-shot b-shot-a" delay={0.35} distance={180} grouped>
            <TransitionLink
              href="/brief/work/ancora"
              className="b-shot-link"
              data-cursor="CASE STUDY"
            >
              <Clip
                src="/brief/clips/ancora-dag.mp4"
                poster="/brief/clips/ancora-dag.jpg"
                label="Ancora: a run's DAG reconstructed live from Temporal history"
                className="b-shot-media"
              />
              <span className="b-tag b-shot-tag">Ancora · live run DAG</span>
            </TransitionLink>
          </PopUp>
          <PopUp className="b-shot b-shot-b" delay={0.55} distance={200} grouped>
            <TransitionLink
              href="/brief/work/ancora"
              className="b-shot-link"
              data-cursor="CASE STUDY"
            >
              <Clip
                src="/brief/clips/ancora-chaos.mp4"
                poster="/brief/clips/ancora-chaos.jpg"
                label="Ancora: recovering after a worker is SIGKILLed mid-run"
                className="b-shot-media"
              />
              <span className="b-tag b-shot-tag">
                Ancora · SIGKILL recovery
              </span>
            </TransitionLink>
          </PopUp>
        </PopGroup>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Work() {
  return (
    <section id="work" className="b-section">
      <div className="b-wrap">
        <header className="b-work-head">
          <MaskTitle as="h2" className="b-display b-giant">
            Featured work
          </MaskTitle>
          <p className="b-cue">(scroll to explore)</p>
        </header>

        <ol className="b-spreads">
          {SPOTLIGHT.map((s, i) => (
            <Spread key={s.id} s={s} i={i} />
          ))}
        </ol>

        <Reveal className="b-more">
          <h3 className="b-kicker">More work</h3>
          <ul className="b-index">
            {MORE.map((id) => {
              const p = PROJECT_DOCS[id];
              return (
                <li key={id}>
                  <TransitionLink href={`/brief/work/${id}`} data-cursor="VIEW">
                    <span className="b-index-title">
                      {p.shortTitle ?? p.title}
                    </span>
                    <span className="b-index-line">{p.tagline}</span>
                    <span className="b-index-year">{years(p.period)}</span>
                  </TransitionLink>
                </li>
              );
            })}
          </ul>
          <a
            className="b-textlink"
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Everything public is on github.com/{PROFILE.github} ↗
          </a>
        </Reveal>
      </div>
    </section>
  );
}

function Spread({ s, i }: { s: (typeof SPOTLIGHT)[number]; i: number }) {
  const p = PROJECT_DOCS[s.id];
  const repo = repoOf(p);
  const live = liveOf(p);
  const flip = i % 2 === 1;
  return (
    <li className={`b-spread ${flip ? "is-flip" : ""}`}>
      <PopUp className="b-cover-wrap">
        <TransitionLink
          href={`/brief/work/${p.id}`}
          className={`b-cover is-${s.tone}`}
          aria-label={`${p.title}: read the case study`}
          data-cursor="CASE STUDY"
        >
          {s.tone === "photo" && p.demo ? (
            <>
              <Clip
                src="/brief/clips/ancora-chaos.mp4"
                poster="/brief/clips/ancora-chaos.jpg"
                label={`${p.title} demo`}
                className="b-cover-media"
              />
              <span className="b-tag b-tag-solid b-cover-play">
                ▶ Demo · {p.demo.length}
              </span>
            </>
          ) : (
            p.architecture.diagram && (
              <Schematic
                spec={p.architecture.diagram}
                className="b-cover-art"
              />
            )
          )}
          <span className="b-cover-figure">
            <span className="b-cover-num">{s.figure}</span>
            <span className="b-cover-cap">{s.caption}</span>
          </span>
        </TransitionLink>
      </PopUp>

      <PopUp className="b-spread-text" delay={0.12} distance={60}>
        <p className="b-meta">
          {String(i + 1).padStart(2, "0")} / {p.context}
        </p>
        <h3 className="b-title">
          <TransitionLink href={`/brief/work/${p.id}`}>
            {p.shortTitle ?? p.title}
          </TransitionLink>
        </h3>
        <p className="b-body">{p.tagline}</p>
        <p className="b-meta">
          {p.role} · {p.period}
        </p>
        <p className="b-links">
          <TransitionLink href={`/brief/work/${p.id}`} className="b-textlink">
            Read the case study →
          </TransitionLink>
          {p.demo && (
            <a
              className="b-textlink is-quiet"
              href={youtubeUrl(p.demo.youtube)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch the demo · {p.demo.length} ↗
            </a>
          )}
          {live && (
            <a
              className="b-textlink is-quiet"
              href={live.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              Try it live ↗
            </a>
          )}
          {repo && (
            <a
              className="b-textlink is-quiet"
              href={repo.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              Code ↗
            </a>
          )}
        </p>
      </PopUp>
    </li>
  );
}

/* ------------------------------------------------------------------ */

function About() {
  return (
    <section id="about" className="b-section">
      <div className="b-wrap">
        <MaskTitle as="h2" className="b-display b-large">
          About
        </MaskTitle>

        <div className="b-split b-about">
          <Reveal>
            <p className="b-lede">
              Chemical engineering by degree; AI engineering by obsession.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="b-body">
              I’m Ritankar, an AI and LLM engineer studying at IIT Madras.
              Across four industry internships I’ve shipped both the model and
              the systems that keep it running: fine-tuning, benchmarking and
              serving tool-calling LLMs on constrained GPU hardware, and
              building the fault-tolerant, observable distributed infrastructure
              underneath them.
            </p>
          </Reveal>
        </div>

        <ol className="b-timeline">
          {EXPERIENCE.map((r) => (
            <Reveal as="li" key={r.company} className="b-split">
              <p className="b-year">{r.period}</p>
              <div>
                <h3 className="b-role">
                  {r.company}, {r.title}.
                </h3>
                <p className="b-role-where">{r.location}</p>
                <p className="b-body b-muted">{r.bullets[0]}</p>
                {r.bullets.length > 1 && (
                  <details className="b-details">
                    <summary>
                      <span className="b-details-open">
                        {r.bullets.length - 1} more
                      </span>
                      <span className="b-details-close">Less</span>
                    </summary>
                    <ul>
                      {r.bullets.slice(1).map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </Reveal>
          ))}
          <Reveal as="li" className="b-split">
            <p className="b-year">{EDUCATION.period}</p>
            <div>
              <h3 className="b-role">{EDUCATION.school}.</h3>
              <p className="b-role-where">{EDUCATION.degree}</p>
            </div>
          </Reveal>
        </ol>
      </div>
    </section>
  );
}

function OpenSource() {
  // one row per upstream, newest work first within it
  const groups = UPSTREAMS_ALL.map((name) => ({
    name,
    org: OPEN_SOURCE.find((c) => upstreamOf(c.project) === name)?.org,
    prs: OPEN_SOURCE.filter((c) => upstreamOf(c.project) === name),
  }));
  return (
    <section id="open-source" className="b-section">
      <div className="b-wrap">
        <div className="b-split b-section-head">
          <MaskTitle as="h2" className="b-display b-medium">
            Open source
          </MaskTitle>
          <Reveal>
            <p className="b-body b-muted">
              {MERGED.length} pull requests merged into {list(UPSTREAMS)}, and{" "}
              {OPEN_SOURCE.length - MERGED.length} more in review. Small, real
              fixes in tools other people run in production.
            </p>
          </Reveal>
        </div>

        <ul className="b-oss">
          {groups.map((g) => (
            <Reveal as="li" key={g.name}>
              <h3 className="b-oss-name">
                {g.name}
                {g.org && <span className="b-oss-org">{g.org}</span>}
              </h3>
              <ul className="b-oss-prs">
                {g.prs.map((c) => (
                  <li key={c.repo + c.pr}>
                    <a
                      href={`https://github.com/${c.repo}/pull/${c.pr}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="b-oss-what">{c.what}</span>
                      {c.merged ? (
                        <span className="b-oss-status">
                          Merged {monthName(c.merged)}
                        </span>
                      ) : (
                        <span className="b-oss-status is-open">In review</span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Recognition() {
  return (
    <section id="record" className="b-section">
      <div className="b-wrap b-split">
        <div className="b-sticky-head">
          <MaskTitle as="h2" className="b-display b-medium">
            Recognition
          </MaskTitle>
        </div>
        <ol className="b-awards">
          {ACHIEVEMENTS.map((a) => (
            <Reveal as="li" key={a}>
              {a}
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Stack() {
  return (
    <section id="stack" className="b-section">
      <div className="b-wrap">
        <div className="b-split b-section-head">
          <MaskTitle as="h2" className="b-display b-medium">
            Stack
          </MaskTitle>
        </div>
        <Reveal>
          <dl className="b-stack">
            {SKILLS.map((g) => (
              <div key={g.label}>
                <dt>{g.label}</dt>
                {g.items.map((s) => (
                  <dd key={s}>{s}</dd>
                ))}
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="b-contact">
      <div className="b-wrap">
        <h2 className="b-display b-contact-title">
          <MaskTitle as="span">Let’s build something</MaskTitle>
          <MaskTitle as="span" delay={0.08}>
            that holds up.
          </MaskTitle>
        </h2>
        <Reveal className="b-contact-actions">
          <CopyEmail />
          <a
            className="b-pill-ghost"
            href={PROFILE.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Resume ↓
          </a>
        </Reveal>
      </div>
    </section>
  );
}
