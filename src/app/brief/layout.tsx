import type { Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { SmoothScroll } from "@/components/brief/motion";
import {
  BriefFooter,
  BriefNav,
  FloatingTags,
} from "@/components/brief/chrome";
import { CustomCursor } from "@/components/brief/cursor";
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
const text = Inter({
  variable: "--font-text",
  subsets: ["latin"],
});

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function BriefLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScroll>
      <div className={`brief ${display.variable} ${text.variable}`}>
        <BriefNav />
        <div className="brief-page">{children}</div>
        <BriefFooter />
        <FloatingTags />
        <CustomCursor />
      </div>
    </SmoothScroll>
  );
}
