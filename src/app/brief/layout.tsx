import type { Viewport } from "next";
import Link from "next/link";
import { PROFILE } from "@/content/portfolio";
import { SmoothScroll } from "@/components/brief/motion";
import { BriefNav } from "@/components/brief/chrome";
import "./brief.css";

/**
 * Shared frame for /brief and its case studies. The nav and footer sit
 * outside `.brief-page`, so a page transition swaps only the page while
 * the nav holds still (see the view-transition rules in brief.css).
 */
// the room's chrome colour is its warm brown; the brief is black
export const viewport: Viewport = { themeColor: "#000000" };

export default function BriefLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScroll>
      <div className="brief">
        <BriefNav />
        <div className="brief-page">{children}</div>
        <footer className="brief-wrap">
          <div className="brief-footer">
            <p>
              © {new Date().getFullYear()} {PROFILE.name}
            </p>
            <Link href="/">Walk into the room →</Link>
          </div>
        </footer>
      </div>
    </SmoothScroll>
  );
}
