import type { Metadata } from "next";
import {
  ACHIEVEMENTS,
  EDUCATION,
  EXPERIENCE,
  PROFILE,
  SKILLS,
} from "@/content/portfolio";
import {
  ARCHIVE,
  FEATURED,
  PROJECT_DOCS,
  type ProjectDoc,
} from "@/content/work";
import {
  Marquee,
  MaskTitle,
  Parallax,
  Reveal,
  TransitionLink,
} from "@/components/brief/motion";
import { real } from "@/components/brief/util";

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

const SECTIONS = [
  { id: "experience", n: "01", object: "Whiteboard", title: "Experience" },
  { id: "work", n: "02", object: "Monitor", title: "Selected work" },
  { id: "record", n: "03", object: "Bookshelf", title: "Record" },
  { id: "stack", n: "04", object: "Server rack", title: "Stack" },
  { id: "contact", n: "05", object: "Laptop", title: "Contact" },
] as const;

export default function BriefPage() {
  const featured = FEATURED.map((id) => PROJECT_DOCS[id]);
  // two columns that drift at different speeds on desktop
  const left = featured.filter((_, i) => i % 2 === 0);
  const right = featured.filter((_, i) => i % 2 === 1);

  return (
    <main className="brief-wrap">
      <Hero />

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
      <section id="record" className="brief-section">
        <SectionHead {...SECTIONS[2]} accent="on the shelf" />
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

      {/* ---------------------------------------------------- 04 */}
      <section id="stack" className="brief-section">
        <SectionHead {...SECTIONS[3]} accent="what it runs on" />
        <Marquee items={SKILLS.flatMap((g) => g.items)} />
        <div className="brief-skills">
          {SKILLS.map((g, i) => (
            <Reveal key={g.label} delay={(i % 4) * 0.05}>
              <div>
                <p className="brief-label">{g.label}</p>
                <p className="brief-skill-items">{g.items.join(" · ")}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- 05 */}
      <section id="contact" className="brief-section brief-contact">
        <SectionHead {...SECTIONS[4]} accent="say hello" />
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
            <a
              href={`https://github.com/${PROFILE.github}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub ↗
            </a>
            <a
              href={`https://leetcode.com/u/${PROFILE.leetcode}/`}
              target="_blank"
              rel="noopener noreferrer"
            >
              LeetCode ↗
            </a>
          </p>
        </Reveal>
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section id="top" className="brief-hero">
      <Reveal immediate delay={0.05}>
        <p className="brief-label">{PROFILE.tagline} · The brief</p>
      </Reveal>

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
        <Reveal immediate delay={0.5}>
          <p className="brief-summary">{PROFILE.summary}</p>
          <p className="brief-cta">
            <a
              className="brief-btn brief-btn-solid"
              href={PROFILE.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download resume
            </a>
            <a className="brief-btn" href={`mailto:${PROFILE.email}`}>
              Email me
            </a>
          </p>
        </Reveal>

        <Reveal immediate delay={0.62}>
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
        </Reveal>
      </div>
    </section>
  );
}

function SectionHead({
  n,
  object,
  title,
  accent,
}: {
  n: string;
  object: string;
  title: string;
  accent: string;
}) {
  return (
    <header className="brief-head">
      <p className="brief-label">
        {n} · {object}
      </p>
      <MaskTitle className="brief-h2">
        {title} <span className="brief-hand">{accent}</span>
      </MaskTitle>
    </header>
  );
}

function ProjectCard({ p, n }: { p: ProjectDoc; n: number }) {
  const result = real(p.results)[0];
  const stack = p.stack.flatMap((g) => g.items).slice(0, 5);
  return (
    // `order` restores reading order on phones, where the two parallax
    // columns dissolve into one grid (see .brief-col in brief.css)
    <Reveal style={{ order: n }}>
      <TransitionLink
        href={`/brief/work/${p.id}`}
        className="brief-card"
        aria-label={`${p.title} — read the case study`}
      >
        <div className="brief-card-top">
          <span className="brief-label">{String(n).padStart(2, "0")}</span>
          <span className="brief-label">{p.period}</span>
        </div>
        <h3 className="brief-card-title">{p.shortTitle ?? p.title}</h3>
        <p className="brief-dim brief-card-context">{p.context}</p>
        <p className="brief-card-tagline">{p.tagline}</p>
        {result && <p className="brief-card-result">{result}</p>}
        <ul className="brief-chips">
          {stack.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <span className="brief-card-more">Read the case study →</span>
      </TransitionLink>
    </Reveal>
  );
}
