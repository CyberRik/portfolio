import type { Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import localFont from "next/font/local";
import { SmoothScroll } from "@/components/brief/motion";
import { BriefFooter, BriefNav, FloatingTags } from "@/components/brief/chrome";
import {
  CustomCursor,
  MatrixSpotlightBackground,
} from "@/components/brief/cursor";
import "./brief.css";

/**
 * Shared frame for /brief and its case studies. The nav and footer sit
 * outside `.brief-page`, so a page transition swaps only the page while
 * the nav holds still (see the view-transition rules in brief.css).
 *
 * The brief is the room's opposite on purpose: the room is warm, dark
 * and playful; the brief is white paper, two typefaces and one colour.
 */

// Display: Inter Tight, set large and tight. Text: Inter.
const display = Inter_Tight({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
/**
 * Commit Mono (OFL — licence in ./fonts) for the small technical layer:
 * labels, meta lines, figures, the ASCII field. Never headings or body.
 * Self-hosted and subset (Latin + the arrows/maths the field draws) so
 * λ ∑ → render at the same cell width as everything else.
 */
const mono = localFont({
  src: "./fonts/CommitMono-400.woff2",
  weight: "400",
  variable: "--font-mono",
  display: "swap",
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Consolas",
    "monospace",
  ],
  adjustFontFallback: false,
});
const text = Inter({
  variable: "--font-text",
  subsets: ["latin"],
});

export const viewport: Viewport = { themeColor: "#f6f5f1" };

export default function BriefLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScroll>
      <div
        className={`brief ${display.variable} ${text.variable} ${mono.variable}`}
      >
        {/* one quiet, viewport-sized character field behind every section
            (sparse, still, fainter, never under text); the hero draws its
            own livelier one (it hides the room), so this one yields there */}
        <MatrixSpotlightBackground className="is-page" exclude=".b-hero" calm />
        <BriefNav />
        <div className="brief-page">{children}</div>
        <BriefFooter />
        <FloatingTags />
        <CustomCursor />
      </div>
    </SmoothScroll>
  );
}
