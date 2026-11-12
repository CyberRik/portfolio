import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ARCHIVE,
  FEATURED,
  PROJECT_DOCS,
  isTodo,
  type ProjectDoc,
  type ProjectId,
} from "@/content/work";
import { MaskTitle, Reveal, TransitionLink } from "@/components/brief/motion";
import { real, realOne } from "@/components/brief/util";
import { ArchDiagram } from "@/components/os/ArchDiagram";

/**
 * /brief/work/[id] — one case study per project, prerendered from
 * PROJECT_DOCS (the same docs the room's Projects app reads).
 *
 * Ordered for a reader in a hurry: what it is, what it achieved, then the
 * problem, the architecture and the hard parts. Unwritten todo() fields
 * are dropped, and a section with nothing real in it is not rendered.
 */

type Params = { id: string };

const ORDER: ProjectId[] = [...FEATURED, ...ARCHIVE];

const docFor = (id: string): ProjectDoc | undefined =>
  (PROJECT_DOCS as Record<string, ProjectDoc>)[id];

export function generateStaticParams(): Params[] {
  return ORDER.map((id) => ({ id }));
}

// only the ids above exist; anything else is a 404, not a runtime render
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const p = docFor((await params).id);
  if (!p) return {};
  const title = `${p.shortTitle ?? p.title} — Ritankar Mondal`;
  return {
    title,
    description: p.tagline,
    alternates: { canonical: `/brief/work/${p.id}` },
    openGraph: { title, description: p.tagline, type: "article" },
  };
}

export default async function CaseStudy({
  params,
}: {
  params: Promise<Params>;
}) {
  const p = docFor((await params).id);
  if (!p) notFound();

  const results = real(p.results);
  const challenges = p.challenges.filter(
    (c) => !isTodo(c.title) && !isTodo(c.body),
  );
  const lessons = real(p.lessons);
  const timeline = p.timeline.filter((t) => !isTodo(t.what));
  const overview = realOne(p.overview);
  const problem = realOne(p.problem);
  const arch = realOne(p.architecture.summary);
  const links = p.links.filter((l) => !isTodo(l.href));

  // next in reading order, wrapping — the page always hands you onward
  const next = PROJECT_DOCS[ORDER[(ORDER.indexOf(p.id) + 1) % ORDER.length]];
  const related = p.related
    .filter((id) => id !== next.id)
    .map((id) => PROJECT_DOCS[id]);

  return (
    <main className="brief-wrap brief-case">
      <header className="brief-case-head">
        <Reveal immediate>
          <TransitionLink href="/brief#work" className="brief-back">
            ← All work
          </TransitionLink>
        </Reveal>
        <Reveal immediate delay={0.05}>
          <p className="brief-label">
            {p.context} · {p.period}
          </p>
        </Reveal>
        <MaskTitle as="h1" immediate delay={0.1} className="brief-case-title">
          {p.title}
        </MaskTitle>
        <Reveal immediate delay={0.25}>
          <p className="brief-case-tagline">{p.tagline}</p>
        </Reveal>

        <Reveal immediate delay={0.35}>
          <dl className="brief-facts">
            <div>
              <dt className="brief-label">Role</dt>
              <dd>{p.role}</dd>
            </div>
            <div>
              <dt className="brief-label">When</dt>
              <dd>{p.period}</dd>
            </div>
            <div>
              <dt className="brief-label">Where</dt>
              <dd>{p.context}</dd>
            </div>
            {links.length > 0 && (
              <div>
                <dt className="brief-label">Links</dt>
                <dd className="brief-facts-links">
                  {links.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {l.label} ↗
                    </a>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </Reveal>
      </header>

      {results.length > 0 && (
        <Block title="Results">
          <ol className="brief-results">
            {results.map((r, i) => (
              <Reveal as="li" key={r} delay={Math.min(i, 4) * 0.05}>
                {r}
              </Reveal>
            ))}
          </ol>
        </Block>
      )}

      {p.demo && (
        <Block title="Walkthrough">
          <Reveal>
            <a
              className="brief-demo"
              href={`https://www.youtube.com/watch?v=${p.demo.youtube}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a static poster; next/image adds nothing here */}
              <img src={p.demo.poster} alt="" loading="lazy" />
              <span className="brief-demo-play">
                ▶ Watch on YouTube · {p.demo.length}
              </span>
            </a>
            <p className="brief-prose brief-dim">{p.demo.blurb}</p>
          </Reveal>
        </Block>
      )}

      {(overview || problem) && (
        <Block title="The problem">
          <Reveal>
            {overview && <p className="brief-prose">{overview}</p>}
            {problem && <p className="brief-prose">{problem}</p>}
          </Reveal>
        </Block>
      )}

      {(arch || p.architecture.diagram) && (
        <Block
          title="Architecture"
          wide={
            p.architecture.diagram && (
              <Reveal className="brief-arch">
                <ArchDiagram spec={p.architecture.diagram} fit />
              </Reveal>
            )
          }
        >
          {arch && (
            <Reveal>
              <p className="brief-prose">{arch}</p>
            </Reveal>
          )}
        </Block>
      )}

      {challenges.length > 0 && (
        <Block title="Hard parts">
          <ol className="brief-challenges">
            {challenges.map((c, i) => (
              <Reveal as="li" key={c.title}>
                <span className="brief-label">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="brief-h3">{c.title}</h3>
                  <p className="brief-prose brief-dim">{c.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </Block>
      )}

      {lessons.length > 0 && (
        <Block title="What I took from it">
          <ul className="brief-lessons">
            {lessons.map((l) => (
              <Reveal as="li" key={l}>
                {l}
              </Reveal>
            ))}
          </ul>
        </Block>
      )}

      <Block title="Stack">
        <Reveal>
          <dl className="brief-stack">
            {p.stack.map((g) => (
              <div key={g.group}>
                <dt className="brief-label">{g.group}</dt>
                <dd>{g.items.join(" · ")}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </Block>

      {timeline.length > 0 && (
        <Block title="Timeline">
          <ol className="brief-timeline">
            {timeline.map((t, i) => (
              <Reveal as="li" key={i}>
                <span className="brief-label">{t.when}</span>
                <p>{t.what}</p>
              </Reveal>
            ))}
          </ol>
        </Block>
      )}

      <nav className="brief-next" aria-label="More work">
        <Reveal>
          <TransitionLink
            href={`/brief/work/${next.id}`}
            className="brief-next-link"
          >
            <span className="brief-label">Next project</span>
            <span className="brief-next-title">
              {next.shortTitle ?? next.title} <span aria-hidden>→</span>
            </span>
            <span className="brief-dim">{next.tagline}</span>
          </TransitionLink>
        </Reveal>
        {related.length > 0 && (
          <Reveal>
            <p className="brief-label">Related</p>
            <ul className="brief-related">
              {related.map((r) => (
                <li key={r.id}>
                  <TransitionLink href={`/brief/work/${r.id}`}>
                    {r.shortTitle ?? r.title} <span aria-hidden>→</span>
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </nav>
    </main>
  );
}

/**
 * A numbered section: number + title beside the content on desktop.
 * Numbered by a CSS counter, so skipping an empty section leaves no gap.
 * `wide` content runs full width under both columns (diagrams).
 */
function Block({
  title,
  children,
  wide,
}: {
  title: string;
  children?: React.ReactNode;
  wide?: React.ReactNode;
}) {
  return (
    <section className="brief-block">
      <header>
        <p className="brief-label brief-block-n" aria-hidden />
        <MaskTitle className="brief-block-title">{title}</MaskTitle>
      </header>
      <div>{children}</div>
      {wide && <div className="brief-block-wide">{wide}</div>}
    </section>
  );
}
