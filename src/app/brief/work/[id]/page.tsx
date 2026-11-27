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

  return (
    <main className="b-case">
      <header className="b-wrap b-case-head">
        <Reveal immediate>
          <TransitionLink href="/brief#work" className="b-back">
            ← All work
          </TransitionLink>
        </Reveal>
        <h1 className="b-display b-case-title">
          <MaskTitle as="span" immediate delay={0.05}>
            {p.title}
          </MaskTitle>
        </h1>
        <Reveal immediate delay={0.2}>
          <p className="b-case-tagline">{p.tagline}</p>
        </Reveal>

        <Reveal immediate delay={0.3}>
          <dl className="b-facts">
            <div>
              <dt>Role</dt>
              <dd>{p.role}</dd>
            </div>
            <div>
              <dt>Timeline</dt>
              <dd>{p.period}</dd>
            </div>
            <div>
              <dt>Context</dt>
              <dd>{p.context}</dd>
            </div>
            {links.length > 0 && (
              <div>
                <dt>Links</dt>
                <dd className="b-facts-links">
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

      {p.demo && (
        <div className="b-wrap">
          <Reveal>
            <a
              className="b-demo"
              href={`https://www.youtube.com/watch?v=${p.demo.youtube}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a static poster; next/image adds nothing here */}
              <img src={p.demo.poster} alt="" loading="lazy" />
              <span className="b-tag b-tag-solid b-demo-play">
                ▶ Watch on YouTube · {p.demo.length}
              </span>
            </a>
            <p className="b-caption">{p.demo.blurb}</p>
          </Reveal>
        </div>
      )}

      {results.length > 0 && (
        <Block title="The outcome">
          <ol className="b-results">
            {results.map((r) => (
              <Reveal as="li" key={r}>
                {r}
              </Reveal>
            ))}
          </ol>
        </Block>
      )}

      {(overview || problem) && (
        <Block title="The challenge">
          <Reveal>
            {overview && <p className="b-prose">{overview}</p>}
            {problem && <p className="b-prose">{problem}</p>}
          </Reveal>
        </Block>
      )}

      {(arch || p.architecture.diagram) && (
        <Block
          title="The system"
          wide={
            p.architecture.diagram && (
              <Reveal className="b-arch">
                <ArchDiagram spec={p.architecture.diagram} fit />
              </Reveal>
            )
          }
        >
          {arch && (
            <Reveal>
              <p className="b-prose">{arch}</p>
            </Reveal>
          )}
        </Block>
      )}

      {challenges.length > 0 && (
        <Block title="The hard parts">
          <ol className="b-hard">
            {challenges.map((c) => (
              <Reveal as="li" key={c.title}>
                <h3 className="b-hard-title">{c.title}</h3>
                <p className="b-prose b-muted">{c.body}</p>
              </Reveal>
            ))}
          </ol>
        </Block>
      )}

      {lessons.length > 0 && (
        <Block title="What I took from it">
          <ul className="b-lessons">
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
          <dl className="b-case-stack">
            {p.stack.map((g) => (
              <div key={g.group}>
                <dt>{g.group}</dt>
                <dd>{g.items.join(", ")}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </Block>

      {timeline.length > 0 && (
        <Block title="Timeline">
          <ol className="b-case-timeline">
            {timeline.map((t, i) => (
              <Reveal as="li" key={i}>
                <span>{t.when}</span>
                <p>{t.what}</p>
              </Reveal>
            ))}
          </ol>
        </Block>
      )}

      <nav className="b-next" aria-label="Next project">
        <div className="b-wrap">
          <TransitionLink href={`/brief/work/${next.id}`} className="b-next-link">
            <span className="b-cue">(next project)</span>
            <span className="b-display b-next-title">
              {next.shortTitle ?? next.title}
            </span>
            <span className="b-next-line">{next.tagline}</span>
          </TransitionLink>
        </div>
      </nav>
    </main>
  );
}

/**
 * A titled section: title on the left, content on the right on desktop.
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
    <section className="b-wrap b-block">
      <div className="b-split">
        <h2 className="b-block-title">{title}</h2>
        <div>{children}</div>
      </div>
      {wide && <div className="b-block-wide">{wide}</div>}
    </section>
  );
}
