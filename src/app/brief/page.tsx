import type { Metadata } from "next";
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
} from "@/content/work";
import {
  Marquee,
  MaskTitle,
  Parallax,
  Reveal,
  TransitionLink,
} from "@/components/brief/motion";
import {
  BlurIn,
  HeroArt,
  NumbersWall,
  PopChips,
  type Stat,
} from "@/components/brief/effects";
import { real } from "@/components/brief/util";
import { SectionIcon, type IconName } from "@/components/brief/icons";
import { Flower } from "@/components/brief/toys";
import { GitHubMark } from "@/components/brief/marks";

/**
 * /brief — the room, flattened into one readable page.
 *
 * Same content as the 3D workspace (it reads the same content files, so
 * the two can never drift), laid out for the visitor who has thirty
 * seconds, a phone, or no WebGL. Each section is headed by the room
 * object that holds it, so someone who has seen the room recognises the
 * map, and someone who hasn't just gets a clean page.
 *
 * Server-rendered: none of three.js ships here.
 */

export const metadata: Metadata = {
  title: "Ritankar Mondal — AI Engineer · The Brief",
  description: PROFILE.summary,
  alternates: { canonical: "/brief" },
  openGraph: {
    title: "Ritankar Mondal — AI Engineer",
    description: PROFILE.summary,
    type: "profile",
  },
};

const SECTIONS: readonly {
  id: string;
  n: string;
  object: string;
  title: string;
  icon: IconName;
}[] = [
  { id: "experience", n: "01", object: "Whiteboard", title: "Experience", icon: "rocket" },
  { id: "work", n: "02", object: "Monitor", title: "Selected work", icon: "sparkles" },
  { id: "open-source", n: "03", object: "Upstream", title: "Open source", icon: "seedling" },
  { id: "record", n: "04", object: "Bookshelf", title: "Record", icon: "trophy" },
  { id: "stack", n: "05", object: "Server rack", title: "Stack", icon: "gear" },
  { id: "contact", n: "06", object: "Laptop", title: "Contact", icon: "wave" },
];

/**
 * The numbers wall. Every figure is lifted from that project's `results`
 * (or, for OctonData, the EXPERIENCE bullet) in the content files — this
 * list selects and shortens, it never computes or rounds. If a source
 * line changes, change the card with it.
 *
 * Kept to six on purpose: the wall sits between the hero and Experience,
 * and every extra card is another half-screen a recruiter scrolls before
 * reaching the work history. Only figures that land without context.
 */
const STATS: Stat[] = [
  {
    value: "45.9% → 97.7%",
    label: "task success for a 3.35B banking agent across five languages",
    href: "/brief/work/desi-agent",
    project: "Desi Agent",
  },
  {
    value: "97%",
    label: "BFCL accuracy on single-turn function calling, fine-tuned Qwen3-8B",
    href: "/brief/work/toolcalllm",
    project: "ToolCallLM",
  },
  {
    value: "11 → 55 tok/s",
    label: "5× inference throughput via prefix and persistent context caching",
    href: "/brief/work/senpai",
    project: "Senpai",
  },
  {
    value: "10K+",
    label: "pages processed per month, end to end",
    href: "/brief/work/tax-cpa-parser",
    project: "Tax CPA Parser",
  },
  {
    value: "40%+",
    label: "less manual review time across 10+ U.S. CPA firms",
    href: "/brief/work/tax-cpa-parser",
    project: "OctonData",
  },
  {
    value: "9.5×",
    label: "faster worker-death detection — ~60s down to ~6s",
    href: "/brief/work/ancora",
    project: "Ancora",
  },
];

/* ------------------------------------------------------------------ */
/* Proof you can click. Every link below is read off the content
   files, so a repo or demo added there shows up here on its own.     */

const GITHUB_URL = `https://github.com/${PROFILE.github}`;
/** a repository root on the profile, not a file or doc inside one */
const REPO_ROOT = new RegExp(
  `^https://github\\.com/${PROFILE.github}/([^/#?]+)/?$`,
  "i",
);
const ALL_PROJECTS = [...FEATURED, ...ARCHIVE].map((id) => PROJECT_DOCS[id]);

const repoLinks = (p: ProjectDoc) =>
  p.links.filter((l) => REPO_ROOT.test(l.href));
const liveLink = (p: ProjectDoc) =>
  p.links.find((l) => /live/i.test(l.label) && !isTodo(l.href));
const youtubeUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

/** the public repos, in the order the projects are featured */
const REPOS = ALL_PROJECTS.flatMap((p) =>
  repoLinks(p).map((l) => ({
    project: p,
    href: l.href,
    name: l.href.match(REPO_ROOT)![1],
    // "GitHub — reach-asr" → "reach-asr"; a bare "GitHub" adds nothing
    note: l.label.includes("—") ? l.label.split("—")[1].trim() : null,
  })),
);
const DEMOS = ALL_PROJECTS.filter((p) => p.demo);
const LIVE = ALL_PROJECTS.flatMap((p) => {
  const l = liveLink(p);
  return l ? [{ project: p, href: l.href }] : [];
});

export default function BriefPage() {
  const featured = FEATURED.map((id) => PROJECT_DOCS[id]);
  // two columns that drift at different speeds on desktop
  const left = featured.filter((_, i) => i % 2 === 0);
  const right = featured.filter((_, i) => i % 2 === 1);

  return (
    <main className="brief-wrap">
      <Hero />

      <NumbersWall
        stats={STATS}
        heading={
          <MaskTitle className="brief-h2">
            The work, <span className="brief-hand">in numbers</span>
          </MaskTitle>
        }
        sub="Every figure here was measured, and every card opens the case study behind it."
      />

      {/* ---------------------------------------------------- 01 */}
      <section id="experience" className="brief-section">
        <SectionHead {...SECTIONS[0]} accent="where it shipped" />
        <ol className="brief-roles">
          {EXPERIENCE.map((r, i) => (
            <Reveal
              as="li"
              key={r.company}
              delay={i * 0.05}
              className="brief-role"
            >
              <div className="brief-role-meta">
                <p className="brief-label">{r.period}</p>
                <p className="brief-dim">{r.location}</p>
              </div>
              <div>
                <h3 className="brief-h3">
                  {r.company}
                  <span className="brief-dim"> — {r.title}</span>
                </h3>
                <ul className="brief-bullets">
                  {r.bullets.slice(0, 2).map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
                {r.bullets.length > 2 && (
                  <details className="brief-more">
                    <summary>{r.bullets.length - 2} more</summary>
                    <ul className="brief-bullets">
                      {r.bullets.slice(2).map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ---------------------------------------------------- 02 */}
      <section id="work" className="brief-section">
        <SectionHead {...SECTIONS[1]} accent="what I built" />
        <SeeItRun />
        <div className="brief-projects">
          <Parallax speed={-40} className="brief-col">
            {left.map((p, i) => (
              <ProjectCard key={p.id} p={p} n={i * 2 + 1} />
            ))}
          </Parallax>
          <Parallax speed={-140} className="brief-col brief-col-offset">
            {right.map((p, i) => (
              <ProjectCard key={p.id} p={p} n={i * 2 + 2} />
            ))}
          </Parallax>
        </div>

        <Reveal>
          <div className="brief-archive">
            <p className="brief-label">Earlier</p>
            <ul>
              {ARCHIVE.map((id) => {
                const p = PROJECT_DOCS[id];
                return (
                  <li key={id}>
                    <TransitionLink href={`/brief/work/${id}`}>
                      <span className="brief-archive-title">{p.title}</span>
                      <span className="brief-dim">{p.tagline}</span>
                      <span className="brief-label">{p.period}</span>
                    </TransitionLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* ---------------------------------------------------- 03 */}
      <section id="open-source" className="brief-section">
        <SectionHead {...SECTIONS[2]} accent="merged upstream" />
        <ol className="brief-oss">
          {OPEN_SOURCE.map((c, i) => (
            <Reveal as="li" key={c.repo + c.pr} delay={Math.min(i, 5) * 0.04}>
              <a
                href={`https://github.com/${c.repo}/pull/${c.pr}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="brief-oss-project">
                  {c.project}
                  {c.org && <span className="brief-dim"> · {c.org}</span>}
                </span>
                <span className="brief-oss-what">{c.what}</span>
                <span className="brief-oss-meta">
                  <span className="brief-label">#{c.pr}</span>
                  <span
                    className={
                      c.merged ? "brief-oss-status" : "brief-oss-status is-open"
                    }
                  >
                    {c.merged ? `Merged ${monthName(c.merged)}` : "In review"}
                  </span>
                </span>
              </a>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ---------------------------------------------------- 04 */}
      <section id="record" className="brief-section">
        <SectionHead {...SECTIONS[3]} accent="on the shelf" />
        <div className="brief-record">
          <ol className="brief-achievements">
            {ACHIEVEMENTS.map((a, i) => (
              <Reveal as="li" key={a} delay={i * 0.04}>
                <span className="brief-label">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p>{a}</p>
              </Reveal>
            ))}
          </ol>
          <Reveal className="brief-edu">
            <p className="brief-label">Education</p>
            <p className="brief-h3">{EDUCATION.school}</p>
            <p className="brief-dim">{EDUCATION.degree}</p>
            <p className="brief-dim">{EDUCATION.period}</p>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------- 05 */}
      <section id="stack" className="brief-section">
        <SectionHead {...SECTIONS[4]} accent="what it runs on" />
        <Marquee items={SKILLS.flatMap((g) => g.items)} />
        <div className="brief-skills">
          {SKILLS.map((g, i) => (
            <Reveal key={g.label} delay={(i % 4) * 0.05}>
              <div>
                <p className="brief-label">{g.label}</p>
                <PopChips
                  items={g.items}
                  className="brief-chips brief-skill-chips"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- 06 */}
      <section id="contact" className="brief-section brief-contact">
        <SectionHead {...SECTIONS[5]} accent="say hello" />
        <Reveal>
          <a className="brief-email" href={`mailto:${PROFILE.email}`}>
            {PROFILE.email}
            <span aria-hidden> ↗</span>
          </a>
          <p className="brief-links">
            <a
              href={PROFILE.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Resume ↓
            </a>
            {PROFILE.links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className={l.href === GITHUB_URL ? "brief-links-gh" : undefined}
              >
                {l.href === GITHUB_URL && <GitHubMark />}
                {l.label} ↗
              </a>
            ))}
          </p>
        </Reveal>
        <Flower />
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ */

const monthName = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${y}`;
};

function Hero() {
  // Order of arrival, after the reference site's hero timeline: the room
  // settles in behind, the name rises line by line, then everything else
  // pulls into focus out of a blur.
  return (
    <section id="top" className="brief-hero">
      <HeroArt />

      <BlurIn delay={0.05}>
        <p className="brief-label">{PROFILE.tagline} · The brief</p>
      </BlurIn>

      <h1 className="brief-h1">
        <MaskTitle as="span" immediate delay={0.1} className="brief-h1-line">
          Ritankar Mondal
        </MaskTitle>
        <MaskTitle
          as="span"
          immediate
          delay={0.22}
          className="brief-h1-line brief-h1-sub"
        >
          builds models, <span className="brief-hand">and the systems</span>
        </MaskTitle>
        <MaskTitle
          as="span"
          immediate
          delay={0.34}
          className="brief-h1-line brief-h1-sub"
        >
          that keep them running.
        </MaskTitle>
      </h1>

      <div className="brief-hero-foot">
        <div>
          <BlurIn delay={0.45}>
            <p className="brief-summary">{PROFILE.summary}</p>
          </BlurIn>
          <BlurIn delay={0.53}>
            <p className="brief-cta">
              <a
                className="brief-btn brief-btn-solid"
                href={PROFILE.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download resume
              </a>
              <a
                className="brief-btn brief-btn-gh"
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHubMark />
                GitHub
                <span className="brief-btn-handle">@{PROFILE.github}</span>
              </a>
              <a className="brief-btn" href={`mailto:${PROFILE.email}`}>
                Email me
              </a>
            </p>
            <p className="brief-profiles">
              <span className="brief-label">Also on</span>
              {PROFILE.links
                .filter((l) => l.href !== GITHUB_URL)
                .map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {l.label} ↗
                  </a>
                ))}
            </p>
          </BlurIn>
        </div>

        <BlurIn delay={0.61}>
          <nav className="brief-contents" aria-label="Contents">
            <p className="brief-label">Contents</p>
            <ol>
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>
                    <span className="brief-label">{s.n}</span>
                    <span>{s.title}</span>
                    <span className="brief-dim">{s.object}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </BlurIn>
      </div>
    </section>
  );
}

function SectionHead({
  n,
  object,
  title,
  accent,
  icon,
}: {
  n: string;
  object: string;
  title: string;
  accent: string;
  icon: IconName;
}) {
  return (
    <header className="brief-head">
      <p className="brief-label">
        {n} · {object}
      </p>
      <MaskTitle className="brief-h2">
        {title} <span className="brief-hand">{accent}</span>
        <SectionIcon name={icon} />
      </MaskTitle>
    </header>
  );
}

function ProjectCard({ p, n }: { p: ProjectDoc; n: number }) {
  const result = real(p.results)[0];
  const stack = p.stack.flatMap((g) => g.items).slice(0, 5);
  const repo = repoLinks(p)[0];
  const live = liveLink(p);
  return (
    // `order` restores reading order on phones, where the two parallax
    // columns dissolve into one grid (see .brief-col in brief.css)
    //
    // The case-study link is stretched over the whole card (its ::after),
    // so the external links can sit inside the card without nesting <a>s.
    <Reveal style={{ order: n }}>
      <article className="brief-card">
        <div className="brief-card-top">
          <span className="brief-label">{String(n).padStart(2, "0")}</span>
          <span className="brief-label">{p.period}</span>
        </div>
        <h3 className="brief-card-title">
          <TransitionLink
            href={`/brief/work/${p.id}`}
            className="brief-card-link"
            aria-label={`${p.title} — read the case study`}
          >
            {p.shortTitle ?? p.title}
          </TransitionLink>
        </h3>
        <p className="brief-dim brief-card-context">{p.context}</p>
        <p className="brief-card-tagline">{p.tagline}</p>
        {result && <p className="brief-card-result">{result}</p>}
        <ul className="brief-chips">
          {stack.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <div className="brief-card-foot">
          <span className="brief-card-more" aria-hidden>
            Read the case study →
          </span>
          {(repo || live || p.demo) && (
            <span className="brief-card-ext">
              {live && (
                <a href={live.href} target="_blank" rel="noopener noreferrer">
                  Live demo ↗
                </a>
              )}
              {p.demo && (
                <a
                  href={youtubeUrl(p.demo.youtube)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ▶ Video
                </a>
              )}
              {repo && (
                <a href={repo.href} target="_blank" rel="noopener noreferrer">
                  <GitHubMark />
                  Code
                </a>
              )}
            </span>
          )}
        </div>
      </article>
    </Reveal>
  );
}

/**
 * The shortest path from "sounds good" to "show me": the recorded demo,
 * the live Space and the code, before anyone has to open a case study.
 */
function SeeItRun() {
  return (
    <div className="brief-run">
      <p className="brief-label brief-run-kicker">See it run</p>
      <div className="brief-run-media">
        {DEMOS.map((p) => (
          <Reveal key={p.id}>
            <a
              className="brief-run-card"
              href={youtubeUrl(p.demo!.youtube)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="brief-run-poster">
                {/* eslint-disable-next-line @next/next/no-img-element -- a static poster; next/image adds nothing here */}
                <img src={p.demo!.poster} alt="" loading="lazy" />
                <span className="brief-demo-play">
                  ▶ Watch · {p.demo!.length}
                </span>
              </span>
              <span className="brief-run-body">
                <span className="brief-label">Watch · YouTube</span>
                <span className="brief-run-title">
                  {p.shortTitle ?? p.title}, end to end
                </span>
                <span className="brief-run-blurb">{p.demo!.blurb}</span>
              </span>
            </a>
          </Reveal>
        ))}
        {LIVE.map(({ project: p, href }) => (
          <Reveal key={p.id}>
            <a
              className="brief-run-card"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="brief-run-poster brief-run-live" aria-hidden>
                <span className="brief-run-url">
                  <span className="brief-run-dot" />
                  {href.replace(/^https:\/\//, "")}
                </span>
                <span className="brief-run-live-title">
                  {p.shortTitle ?? p.title}{" "}
                  <span className="brief-hand">Lab</span>
                </span>
                <span className="brief-demo-play">Open the Space ↗</span>
              </span>
              <span className="brief-run-body">
                <span className="brief-label">Try it · Hugging Face Space</span>
                <span className="brief-run-title">
                  {p.shortTitle ?? p.title}, live
                </span>
                <span className="brief-run-blurb">{p.tagline}</span>
              </span>
            </a>
          </Reveal>
        ))}
      </div>

      <Reveal className="brief-repos">
        <div className="brief-repos-head">
          <p className="brief-label">Read the code · public repositories</p>
          <a
            className="brief-repos-all"
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHubMark />
            All of it on github.com/{PROFILE.github} ↗
          </a>
        </div>
        <ul>
          {REPOS.map((r) => (
            <li key={r.href}>
              <a href={r.href} target="_blank" rel="noopener noreferrer">
                <span className="brief-repos-name">
                  <GitHubMark />
                  <span>
                    <span className="brief-dim">{PROFILE.github}/</span>
                    {r.name}
                  </span>
                </span>
                <span className="brief-dim">
                  {r.project.shortTitle ?? r.project.title}
                  {r.note && ` · ${r.note}`}
                </span>
                <span className="brief-label" aria-hidden>
                  ↗
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  );
}
