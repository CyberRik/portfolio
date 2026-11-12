import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * The link-preview card every route shares (LinkedIn, Slack, X, iMessage).
 * Rendered once at build time — every route using it is static — so
 * reading files from disk here costs nothing at request time.
 *
 * Same language as /brief: true black, Geist, one amber accent. The room's
 * own card passes `background` to sit the text over a render of the room.
 * `_og` is a private folder (leading underscore), so it never becomes a route.
 */

export const OG_SIZE = { width: 1200, height: 630 };

const here = (f: string) => join(process.cwd(), "src/app/_og", f);

export async function ogCard({
  eyebrow,
  title,
  subtitle,
  footer,
  background,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  footer?: string;
  /** a file in src/app/_og to sit behind the text */
  background?: string;
}) {
  const [sans, mono, bg] = await Promise.all([
    readFile(here("Geist-SemiBold.ttf")),
    readFile(here("GeistMono-Medium.ttf")),
    background ? readFile(here(background)) : Promise.resolve(null),
  ]);

  // long titles step down so they never wrap past three lines
  const titleSize = title.length > 34 ? 64 : title.length > 22 ? 80 : 96;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#000",
          fontFamily: "Geist",
          color: "#f5f5f4",
        }}
      >
        {bg && (
          // eslint-disable-next-line @next/next/no-img-element -- satori renders plain <img>
          <img
            src={`data:image/jpeg;base64,${bg.toString("base64")}`}
            width={1200}
            height={630}
            style={{ position: "absolute", inset: 0, opacity: 0.55 }}
            alt=""
          />
        )}
        {/* black from the left, where the text sits */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background: bg
              ? "linear-gradient(90deg, #000 0%, rgba(0,0,0,0.82) 45%, rgba(0,0,0,0.15) 100%)"
              : "radial-gradient(circle at 85% 15%, rgba(255,179,97,0.16), transparent 55%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "64px 72px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Geist Mono",
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#ffb361",
            }}
          >
            {eyebrow}
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", maxWidth: 940 }}
          >
            <div
              style={{
                display: "flex",
                fontSize: titleSize,
                letterSpacing: -3,
                lineHeight: 1.02,
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div
                style={{
                  display: "flex",
                  marginTop: 24,
                  fontSize: 32,
                  lineHeight: 1.3,
                  color: "#d6d3d1",
                  maxWidth: 900,
                }}
              >
                {subtitle}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "Geist Mono",
              fontSize: 20,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#a1a1aa",
            }}
          >
            <span>Ritankar Mondal</span>
            <span>{footer ?? "ritankar-mondal.vercel.app"}</span>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Geist", data: sans, weight: 600, style: "normal" },
        { name: "Geist Mono", data: mono, weight: 500, style: "normal" },
      ],
    },
  );
}
