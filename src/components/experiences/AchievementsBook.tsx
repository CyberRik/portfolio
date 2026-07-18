"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ACHIEVEMENTS, COURSEWORK, EDUCATION } from "@/content/portfolio";
import type { PortalProps } from "./ExperienceOverlay";

/**
 * ACHIEVEMENTS & EDUCATION — a book slides off the shelf and opens.
 *
 * Identity: paper. The one serif world — cream stock, ink, drop caps,
 * roman-numeral chapters, real page turns. Pacing is the slowest of
 * all portals: a book is read, not scanned.
 */

const CHAPTERS = ["Education", "Achievements", "Coursework"] as const;
const NUMERALS = ["I", "II", "III"];

export function AchievementsBook({ onClose }: PortalProps) {
  const [opened, setOpened] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setOpened(true), 1900);
    return () => clearTimeout(t);
  }, []);

  const turn = (d: number) => {
    setDir(d);
    setChapter((c) => Math.min(CHAPTERS.length - 1, Math.max(0, c + d)));
  };

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{
        background: "radial-gradient(85% 85% at 50% 42%, #efe6d2 0%, #ddcfb2 55%, #b7a683 100%)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.3, ease: "easeInOut" }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeIn" } }}
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
          className="relative flex h-[560px] w-[min(880px,94vw)]"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
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
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={chapter}
                className="h-full overflow-y-auto px-10 py-10"
                style={{ transformOrigin: "left center" }}
                custom={dir}
                variants={{
                  enter: (d: number) => ({ rotateY: d > 0 ? 70 : -18, opacity: 0 }),
                  center: { rotateY: 0, opacity: 1 },
                  exit: (d: number) => ({
                    rotateY: d > 0 ? -55 : 40,
                    opacity: 0,
                    transition: { duration: 0.45, ease: [0.5, 0, 0.75, 1] },
                  }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              >
                {chapter === 0 && <EducationPage />}
                {chapter === 1 && <AchievementsPage />}
                {chapter === 2 && <CourseworkPage />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* chapter navigation — the corner of the page */}
          <div className="absolute -bottom-14 left-1/2 flex -translate-x-1/2 items-center gap-6 font-serif text-[14px] text-[#6d5c3c]">
            <button
              onClick={() => turn(-1)}
              disabled={chapter === 0}
              className="transition-opacity disabled:opacity-25 hover:text-[#3a2f1d]"
            >
              ‹ previous
            </button>
            <span className="text-[12px] tracking-[0.3em] uppercase">
              {NUMERALS[chapter]} · {CHAPTERS.length}
            </span>
            <button
              onClick={() => turn(1)}
              disabled={chapter === CHAPTERS.length - 1}
              className="transition-opacity disabled:opacity-25 hover:text-[#3a2f1d]"
            >
              turn the page ›
            </button>
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
        t the {EDUCATION.school}, pursuing a {EDUCATION.degree} ({EDUCATION.period}),
        CGPA {EDUCATION.gpa} — while spending every spare hour on machine learning
        systems that actually ship.
      </p>
      <div className="mt-6 border-l-2 border-[#c2ae85] pl-4">
        <p className="text-[13px] text-[#8a7854] italic">
          Chemical engineering by degree; AI engineering by obsession. The
          distillation column and the transformer have more in common than
          either would admit.
        </p>
      </div>
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
          </motion.li>
        ))}
      </ol>
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
        {COURSEWORK.map((c, i) => (
          <motion.li
            key={c}
            className="flex items-baseline gap-3 text-[15px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.12, duration: 0.4 }}
          >
            <span className="text-[#a08b60]">✦</span>
            <span>{c}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
