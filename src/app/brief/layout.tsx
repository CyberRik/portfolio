import type { Viewport } from "next";
import Link from "next/link";
import { PROFILE } from "@/content/portfolio";
import { SmoothScroll } from "@/components/brief/motion";
import { BriefNav } from "@/components/brief/chrome";
import { PendantLamp } from "@/components/brief/toys";
import { ScrollBeam } from "@/components/brief/progress";
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
        <PendantLamp />
        <ScrollBeam />
        <div className="brief-page">{children}</div>
        <footer className="brief-wrap">
          <div className="brief-footer">
            <p>
              © {new Date().getFullYear()} {PROFILE.name}
            </p>
            <Link href="/" className="brief-footer-room">
              {/* only the inner span moves: the link's own hit area
                  stays put, so the hover can't flicker on and off */}
              <span className="brief-footer-room-text">
                Walk into the room <span aria-hidden>→</span>
              </span>
            </Link>
          </div>
          {/* CC BY 4.0 asks for this credit (section icons) */}
          <p className="brief-credit">
            Animated emoji:{" "}
            <a
              href="https://googlefonts.github.io/noto-emoji-animation/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Noto Emoji by Google
            </a>
            , CC BY 4.0
          </p>
        </footer>
      </div>
    </SmoothScroll>
  );
}
