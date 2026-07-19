"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PROFILE } from "@/content/portfolio";
import type { PortalProps } from "./ExperienceOverlay";
import { Typewriter } from "./Typewriter";
import { DUR, EASE } from "@/lib/design";

const MAILTO = `mailto:${PROFILE.email}?subject=${encodeURIComponent("Let's build something")}`;

/**
 * CONTACT — the laptop opens a message.
 *
 * Identity: intimate. Not fullscreen — the room stays visible, dimmed;
 * a small compose window addresses itself to me, live. The one portal
 * that's about YOU writing, not me presenting.
 */
export function ContactCompose({ onClose }: PortalProps) {
  const [step, setStep] = useState(0);
  const [sent, setSent] = useState(false);

  // the send moment plays first; the mail client opens on its heels
  useEffect(() => {
    if (!sent) return;
    const t = setTimeout(() => {
      window.location.href = MAILTO;
    }, 900);
    return () => clearTimeout(t);
  }, [sent, onClose]);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[2.5px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.9, ease: EASE.inOut }}
      exit={{ opacity: 0, transition: { duration: DUR.exit, ease: EASE.in } }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className="relative w-[min(460px,92vw)] overflow-hidden rounded-2xl border border-white/10 bg-[#191b20]/97 shadow-[0_50px_120px_rgba(0,0,0,0.6)]"
        initial={{ opacity: 0, y: 46, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.96 }}
        transition={{ delay: 0.5, duration: DUR.move, ease: EASE.out }}
      >
        {/* title bar */}
        <div className="flex items-center gap-2 border-b border-white/6 px-4 py-3">
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-3 w-3 rounded-full bg-[#ff5f57] transition-transform hover:scale-110"
          />
          <span className="h-3 w-3 rounded-full bg-white/12" />
          <span className="h-3 w-3 rounded-full bg-white/12" />
          <span className="ml-3 font-mono text-[11px] text-[#8f96a3]">New Message</span>
        </div>

        <div className="px-6 py-5 font-mono text-[13px]">
          <div className="flex gap-3 border-b border-white/6 pb-3">
            <span className="text-[#5d6470]">To:</span>
            <Typewriter
              text={PROFILE.email}
              cps={26}
              startDelay={1.3}
              cursor
              className="text-[#e4e9f2]"
              onDone={() => setStep(1)}
            />
          </div>
          <div className="flex gap-3 border-b border-white/6 py-3">
            <span className="text-[#5d6470]">Subject:</span>
            {step >= 1 && (
              <Typewriter
                text="Let's build something"
                cps={22}
                cursor
                className="text-[#e4e9f2]"
                onDone={() => setStep(2)}
              />
            )}
          </div>
          <motion.p
            className="min-h-[72px] py-4 text-[13px] leading-relaxed text-[#8f96a3] italic"
            initial={{ opacity: 0 }}
            animate={{ opacity: step >= 2 ? 1 : 0 }}
            transition={{ duration: 0.8 }}
          >
            Open to AI engineering roles, research collaborations, and
            interesting problems. I read everything.
            {step >= 2 && <span className="cursor-blink not-italic"> ▍</span>}
          </motion.p>
        </div>

        <div className="flex items-center justify-between border-t border-white/6 px-6 py-4">
          <a
            href={PROFILE.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] tracking-[0.15em] text-[#8f96a3] uppercase transition-colors hover:text-[#e4e9f2]"
          >
            ⎘ attach resume
          </a>
          <button
            onClick={() => setSent(true)}
            className="rounded-full bg-[#e4e9f2] px-5 py-1.5 font-mono text-[12px] font-medium tracking-[0.1em] text-[#14161a] uppercase transition-transform hover:scale-[1.04]"
          >
            Send ↗
          </button>
        </div>

        {/* the send moment — then the mail client takes over */}
        <AnimatePresence>
          {sent && (
            <motion.div
              key="sent"
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#191b20]/97"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: DUR.tap, ease: EASE.out }}
            >
              <motion.span
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#8be0c8]/40 text-[20px] text-[#8be0c8]"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: DUR.ui, ease: EASE.out }}
              >
                ✓
              </motion.span>
              <p className="font-mono text-[11px] tracking-[0.2em] text-[#8f96a3] uppercase">
                opening your mail app
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
