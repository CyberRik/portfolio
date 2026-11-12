"use client";

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

export function BriefNav() {
  const onBrief = usePathname() === "/brief";
  return (
    <header className="brief-nav">
      {onBrief ? (
        <a href="#top" className="brief-nav-name">
          {PROFILE.name}
        </a>
      ) : (
        <TransitionLink href="/brief" className="brief-nav-name">
          {PROFILE.name}
        </TransitionLink>
      )}
      <nav>
        <SectionLink hash="experience" className="brief-hide-sm">
          Experience
        </SectionLink>
        <SectionLink hash="work" className="brief-hide-sm">
          Work
        </SectionLink>
        <a href={PROFILE.resumeUrl} target="_blank" rel="noopener noreferrer">
          Resume
        </a>
        <Link href="/" className="brief-nav-room">
          The room ↗
        </Link>
      </nav>
    </header>
  );
}
