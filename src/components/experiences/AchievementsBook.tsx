"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ACHIEVEMENTS, COURSEWORK, EDUCATION } from "@/content/portfolio";
import type { PortalProps } from "./ExperienceOverlay";
import { DUR, EASE } from "@/lib/design";

/**
 * ACHIEVEMENTS & EDUCATION — a book slides off the shelf and opens.
 *
 * Identity: paper. The one serif world — cream stock, ink, drop caps,
 * roman-numeral chapters, real page turns. Pacing is the slowest of
 * all portals: a book is read, not scanned. This is a working copy,
 * not a display copy: pencil notes in the margins, a sketch, a folded
 * corner — the marks of an owner who actually reads it.
 */

const CHAPTERS = ["Education", "Achievements", "Coursework"] as const;
const NUMERALS = ["I", "II", "III"];

/** the pencil the margins are written with */
const HAND = "var(--font-caveat), cursive";
const PENCIL = "#8d8168";

export function AchievementsBook({ onClose }: PortalProps) {
  const [opened, setOpened] = useState(false);
  const [chapter, setChapter] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setOpened(true), 1900);
    return () => clearTimeout(t);
  }, []);

  const last = chapter === CHAPTERS.length - 1;

  /**
   * The book IS the control. A click turns the page; a click on the last
   * page closes it. This replaced a nav bar hung below the spread, which
   * fell off the bottom of the viewport on short laptop screens — the
   * only affordance was the one people couldn't see.
   */
  const advance = () => {
    if (last) onClose();
    else setChapter((c) => c + 1);
  };

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{
        background: "radial-gradient(85% 85% at 50% 42%, #efe6d2 0%, #ddcfb2 55%, #b7a683 100%)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DUR.world, ease: EASE.inOut }}
      exit={{ opacity: 0, transition: { duration: DUR.exit, ease: EASE.in } }}
    >
      {/* the closed cover — approaches, then opens away */}
      <AnimatePresence>
        {!opened && (
          <motion.div
            key="cover"
            className="absolute z-10 flex h-[520px] w-[380px] flex-col items-center justify-center rounded-r-md rounded-l-sm border border-[#2c2013] shadow-[0_30px_70px_rgba(50,35,15,0.45)]"
            style={{
              background: "linear-gradient(120deg, #4a3722, #35271643 40%, #4a3722) #3f2f1d",
              transformPerspective: 1400,
              transformOrigin: "left center",
            }}
            initial={{ scale: 0.55, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ rotateY: -125, opacity: 0, transition: { duration: 0.9, ease: [0.6, 0, 0.3, 1] } }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="border-y border-[#c9a86a]/60 px-8 py-4 text-center">
              <p className="font-serif text-[22px] tracking-[0.2em] text-[#d9bc80] uppercase">
                Records
              </p>
              <p className="mt-1 font-serif text-[12px] tracking-[0.3em] text-[#a88d5c] italic">
                R. Mondal
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* open spread */}
      {opened && (
        <motion.div
          // height yields to short viewports so the whole trim always
          // fits — nothing about the book may live below the fold
          className="relative flex h-[min(560px,78vh)] w-[min(880px,94vw)] cursor-pointer"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          onClick={advance}
          title={last ? "Close the book" : "Turn the page"}
        >
          {/* left page: chapter frontispiece */}
          <div
            className="hidden flex-1 flex-col items-center justify-center rounded-l-sm border border-[#cfc0a0] border-r-0 px-10 md:flex"
            style={{ background: "linear-gradient(100deg, #f3ead6, #faf4e4 70%)" }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={chapter}
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.25 } }}
                transition={{ duration: 0.7, delay: 0.15 }}
              >
                <p className="font-serif text-[13px] tracking-[0.4em] text-[#a08b60] uppercase">
                  Chapter {NUMERALS[chapter]}
                </p>
                <p className="mt-4 font-serif text-[34px] text-[#3a2f1d]">{CHAPTERS[chapter]}</p>
                <div className="mx-auto mt-5 h-px w-16 bg-[#c2ae85]" />
                <p className="mt-5 font-serif text-[13px] text-[#8a7854] italic">
                  {chapter === 0 && "where the foundations were laid"}
                  {chapter === 1 && "what the numbers say"}
                  {chapter === 2 && "what was studied along the way"}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* spine shadow */}
          <div
            className="hidden w-6 md:block"
            style={{
              background:
                "linear-gradient(90deg, rgba(60,45,20,0.28), rgba(60,45,20,0.06) 45%, rgba(60,45,20,0.32))",
            }}
          />

          {/* right page: chapter body, turning */}
          <div
            className="relative flex-1 overflow-hidden rounded-r-md border border-[#cfc0a0] border-l-0"
            style={{
              background: "linear-gradient(260deg, #f3ead6, #faf4e4 70%)",
              perspective: "1600px",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={chapter}
                // pb reserves the footer gutter so body text never runs
                // underneath the page-turn hint
                className="h-full overflow-y-auto px-10 pt-10 pb-16"
                style={{ transformOrigin: "left center" }}
                // pages only ever turn forward now, so the sheet always
                // sweeps the same way
                initial={{ rotateY: 70, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{
                  rotateY: -55,
                  opacity: 0,
                  transition: { duration: 0.45, ease: [0.5, 0, 0.75, 1] },
                }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              >
                {chapter === 0 && <EducationPage />}
                {chapter === 1 && <AchievementsPage />}
                {chapter === 2 && <CourseworkPage />}
              </motion.div>
            </AnimatePresence>

            {/* page footer — folio left, the book's own affordance right,
                both inside the trim. Written in the same pencil as the
                rest of the marginalia rather than as UI chrome. */}
            <div className="pointer-events-none absolute right-14 bottom-4 left-10 flex items-baseline justify-between">
              <span className="font-serif text-[11px] tracking-[0.3em] text-[#a08b60] uppercase">
                {NUMERALS[chapter]} · {CHAPTERS.length}
              </span>
              <motion.span
                key={chapter}
                className="-rotate-1 text-[15px]"
                style={{ fontFamily: HAND, color: PENCIL }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.85 }}
                transition={{ delay: 0.9, duration: 0.7 }}
              >
                {last ? "close the book ✎" : "turn the page ✎"}
              </motion.span>
            </div>

            {/* folded corner — someone kept their place here */}
            <div
              className="pointer-events-none absolute right-0 bottom-0 h-9 w-9"
              style={{
                background:
                  "linear-gradient(315deg, #d9cca9 0%, #cfc19c 46%, rgba(90,72,40,0.18) 50%, transparent 52%)",
              }}
            />
          </div>
        </motion.div>
      )}

      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-8 right-10 font-serif text-[13px] tracking-[0.25em] text-[#8a7854] uppercase transition-colors hover:text-[#3a2f1d]"
      >
        close the book
      </button>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */

function DropCap({ children }: { children: string }) {
  return (
    <span className="float-left mt-1 mr-2 font-serif text-[52px] leading-[0.8] text-[#7a5c2e]">
      {children}
    </span>
  );
}

function EducationPage() {
  return (
    <div className="font-serif text-[#3a2f1d]">
      <DropCap>A</DropCap>
      <p className="text-[15px] leading-relaxed">
        t the {EDUCATION.school}, pursuing a {EDUCATION.degree} ({EDUCATION.period})
        — while spending every spare hour on machine learning systems that
        actually ship.
      </p>
      <div className="mt-6 border-l-2 border-[#c2ae85] pl-4">
        <p className="text-[13px] text-[#8a7854] italic">
          Chemical engineering by degree; AI engineering by obsession. The
          distillation column and the transformer have more in common than
          either would admit.
        </p>
      </div>

      {/* the owner's pencil sketch — column, arrow, attention block */}
      <svg className="mt-6 ml-2 h-[92px] w-[230px]" viewBox="0 0 230 92">
        {[
          "M 26 8 h 26 v 68 h -26 Z", // column shell
          "M 26 26 h 26 M 26 44 h 26 M 26 62 h 26", // trays
          "M 52 40 C 74 34, 92 34, 112 40 m -8 -6 l 8 6 l -9 4", // arrow
          "M 124 22 h 74 v 44 h -74 Z", // attention block
          "M 134 44 C 148 30, 172 56, 188 40", // the wavy "attention" line
        ].map((d, i) => (
          <motion.path
            key={d}
            d={d}
            fill="none"
            stroke={PENCIL}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.9 }}
            transition={{ delay: 0.7 + i * 0.3, duration: 0.5, ease: "easeInOut", opacity: { delay: 0.7 + i * 0.3, duration: 0.01 } }}
          />
        ))}
        <motion.text x={22} y={90} fontSize={15} fill={PENCIL} style={{ fontFamily: HAND }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2, duration: 0.5 }}>
          distill
        </motion.text>
        <motion.text x={130} y={82} fontSize={15} fill={PENCIL} style={{ fontFamily: HAND }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4, duration: 0.5 }}>
          attend
        </motion.text>
      </svg>
      <motion.p
        className="mt-1 ml-3 -rotate-2 text-[16px]"
        style={{ fontFamily: HAND, color: PENCIL }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.7, duration: 0.6 }}
      >
        same math, different plumbing ✎
      </motion.p>
    </div>
  );
}

function AchievementsPage() {
  return (
    <div className="font-serif text-[#3a2f1d]">
      <ol className="space-y-4">
        {ACHIEVEMENTS.map((a, i) => (
          <motion.li
            key={a}
            className="flex gap-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.18, duration: 0.5 }}
          >
            <span className="mt-0.5 font-serif text-[13px] text-[#a08b60]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-[15px] leading-relaxed">{a}</span>
            {/* checked off in pencil, one by one */}
            <motion.span
              className="mt-0.5 text-[15px]"
              style={{ fontFamily: HAND, color: PENCIL }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.85 + i * 0.18, duration: 0.3 }}
            >
              ✓
            </motion.span>
          </motion.li>
        ))}
      </ol>
      <motion.p
        className="mt-6 ml-8 -rotate-1 text-[16px]"
        style={{ fontFamily: HAND, color: PENCIL }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85 + ACHIEVEMENTS.length * 0.18 + 0.4, duration: 0.6 }}
      >
        all of these counted honestly ✎
      </motion.p>
    </div>
  );
}

function CourseworkPage() {
  return (
    <div className="font-serif text-[#3a2f1d]">
      <DropCap>S</DropCap>
      <p className="text-[15px] leading-relaxed">
        tudied deliberately, applied immediately — every course below shows up
        somewhere in the experience chapters.
      </p>
      <ul className="mt-6 space-y-2.5">
        {COURSEWORK.map((c, i) => {
          // a reader underlines favourites — wavy pencil, not highlighter
          const favourite = i === 0 || i === 3;
          return (
            <motion.li
              key={c}
              className="flex items-baseline gap-3 text-[15px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.12, duration: 0.4 }}
            >
              <span className="text-[#a08b60]">✦</span>
              <span
                style={
                  favourite
                    ? {
                        textDecoration: "underline wavy",
                        textDecorationColor: PENCIL,
                        textDecorationThickness: "1px",
                        textUnderlineOffset: "4px",
                      }
                    : undefined
                }
              >
                {c}
              </span>
            </motion.li>
          );
        })}
      </ul>
      <motion.p
        className="mt-5 ml-6 rotate-1 text-[16px]"
        style={{ fontFamily: HAND, color: PENCIL }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 + COURSEWORK.length * 0.12 + 0.5, duration: 0.6 }}
      >
        wavy lines = the fun ones
      </motion.p>
    </div>
  );
}
