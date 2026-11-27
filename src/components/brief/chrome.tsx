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
 * The email as a button: one click copies it, and the label flips to a
 * confirmation for a moment. A real mailto stays one modifier-click away
 * for anyone who wants their mail client instead.
 */
export function CopyEmail({
  className = "",
  short = false,
}: {
  className?: string;
  /** phones: "Email" instead of the whole address */
  short?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const onClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!navigator.clipboard) return; // let the mailto open instead
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
      className={`brief-pill ${copied ? "is-copied" : ""} ${className}`}
      aria-label={`Copy email address ${PROFILE.email}`}
    >
      <span className="brief-pill-track" aria-hidden>
        <span className="brief-pill-label">
          {short ? (
            <>
              <span className="brief-hide-md">Email</span>
              <span className="brief-show-md">{PROFILE.email}</span>
            </>
          ) : (
            PROFILE.email
          )}
          <CopyGlyph />
        </span>
        <span className="brief-pill-label">Email copied!</span>
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
          <a href={PROFILE.resumeUrl} target="_blank" rel="noopener noreferrer">
            Resume
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
        <Link href="/" className="brief-footer-room">
          The 3D room ↗
        </Link>
        <p>
          {PROFILE.name} — {new Date().getFullYear()}©
        </p>
      </div>
    </footer>
  );
}
