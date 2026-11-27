"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PROFILE } from "@/content/portfolio";
import { TransitionLink } from "./motion";

/**
 * Section links glide in place on /brief (Lenis handles bare "#hash"
 * hrefs), and on a case study they navigate back to that section with a
 * page transition.
 */
function SectionLink({
  hash,
  children,
  className,
}: {
  hash: string;
  children: string;
  className?: string;
}) {
  const onBrief = usePathname() === "/brief";
  return onBrief ? (
    <a href={`#${hash}`} className={className}>
      {children}
    </a>
  ) : (
    <TransitionLink href={`/brief#${hash}`} className={className}>
      {children}
    </TransitionLink>
  );
}

/**
 * The email as a button. With a mouse, one click copies the address (a
 * mailto with no mail client configured silently does nothing, which is
 * common on desktops) and the label flips to a confirmation; a
 * modifier-click still opens the mail client. On touch screens, where
 * mailto reliably opens the mail app, it just follows the link. The full
 * address is always in the title tooltip and the accessible name.
 */
export function CopyEmail({
  className = "",
  short = false,
}: {
  className?: string;
  /** a small "Email" pill instead of the whole address (the nav) */
  short?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const onClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!navigator.clipboard) return; // let the mailto open instead
    if (window.matchMedia("(pointer: coarse)").matches) return;
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${PROFILE.email}`;
    }
  };

  return (
    <a
      href={`mailto:${PROFILE.email}`}
      onClick={onClick}
      className={`brief-pill ${short ? "is-short" : ""} ${copied ? "is-copied" : ""} ${className}`}
      title={PROFILE.email}
      aria-label={`Email ${PROFILE.email} (click copies the address)`}
    >
      <span className="brief-pill-track" aria-hidden>
        <span className="brief-pill-label">
          {short ? (
            "Email"
          ) : (
            <>
              {PROFILE.email}
              <CopyGlyph />
            </>
          )}
        </span>
        <span className="brief-pill-label">
          {short ? "Copied" : "Email copied!"}
        </span>
      </span>
      <span className="brief-sr" aria-live="polite">
        {copied ? "Email copied" : ""}
      </span>
    </a>
  );
}

function CopyGlyph() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <rect x="5" y="5" width="9" height="9" rx="2" />
      <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
    </svg>
  );
}

export function BriefNav() {
  const onBrief = usePathname() === "/brief";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`brief-nav ${scrolled ? "is-scrolled" : ""}`}>
      <div className="brief-nav-inner">
        {onBrief ? (
          <a href="#top" className="brief-nav-name">
            {PROFILE.name}
          </a>
        ) : (
          <TransitionLink href="/brief" className="brief-nav-name">
            {PROFILE.name}
          </TransitionLink>
        )}
        <nav className="brief-nav-links" aria-label="Sections">
          <SectionLink hash="work">Work</SectionLink>
          <SectionLink hash="about">About</SectionLink>
          <a
            href={PROFILE.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Resume (opens in a new tab)"
          >
            Resume ↗
          </a>
        </nav>
        <CopyEmail short className="brief-nav-pill" />
      </div>
    </header>
  );
}

const SHORT: Record<string, string> = {
  GitHub: "GH",
  Kaggle: "KG",
  "Hugging Face": "HF",
};

export function BriefFooter() {
  return (
    <footer className="brief-footer">
      <div className="brief-footer-inner">
        <nav className="brief-footer-links" aria-label="Profiles">
          {PROFILE.links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              title={l.label}
            >
              <span aria-hidden>{SHORT[l.label] ?? l.label}</span>
              <span className="brief-sr">{l.label}</span>
            </a>
          ))}
        </nav>
        <p className="brief-footer-room">
          This is the flat edition. The original is{" "}
          <Link href="/" prefetch={false}>
            a room you can walk through ↗
          </Link>
        </p>
        <p>
          {PROFILE.name} {new Date().getFullYear()}©
        </p>
      </div>
    </footer>
  );
}

/**
 * The résumé pill that floats in the bottom-right corner on phones,
 * where the nav has no room for it (on wider screens the nav carries
 * Resume, so the pill is hidden there). It pops in once the page has settled and tucks away while
 * the contact block (which repeats it) is on screen.
 */
export function FloatingTags() {
  const [tucked, setTucked] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const contact = document.getElementById("contact");
    if (!contact) {
      setTucked(false);
      return;
    }
    const io = new IntersectionObserver(([e]) => setTucked(e.isIntersecting), {
      threshold: 0.2,
    });
    io.observe(contact);
    return () => io.disconnect();
  }, [pathname]);

  return (
    <div className={`b-float ${tucked ? "is-tucked" : ""}`}>
      <a
        className="b-float-tag is-solid"
        href={PROFILE.resumeUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Download resume
      </a>
    </div>
  );
}
