"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { SKILLS } from "@/content/portfolio";
import type { PortalProps } from "./ExperienceOverlay";
import { Typewriter } from "./Typewriter";
import { WORLD_FADE } from "@/lib/design";

/**
 * SKILLS — an SSH session onto the rack.
 *
 * Identity: teal phosphor on near-black, scanlines, everything arrives
 * the way a real ops session does: a login, nvidia-smi with LIVE
 * utilization bars, running containers, then capabilities listed as
 * installed services. The machine is working the whole time.
 */

const T = {
  bg: "#070c0b",
  dim: "#3d6b60",
  txt: "#7fe0cb",
  hot: "#c8fff1",
  warn: "#ffce90",
};

const CONTAINERS = [
  ["rag-retrieval", "langchain · faiss · rerank", "Up 41 days"],
  ["doc-parser", "ocr · yolo · layout", "Up 38 days"],
  ["finetune-worker", "qlora · peft · bfcl-eval", "Up 12 days"],
  ["api-gateway", "fastapi · asyncio · pg", "Up 41 days"],
  ["pipeline-scheduler", "airflow · apify", "Up 27 days"],
];

/** steps gate the transcript; each unlocks the next */
export function SkillsTerminal({ onClose }: PortalProps) {
  const [step, setStep] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const next = (n: number) => () => setStep((s) => Math.max(s, n));

  // timed steps for non-typed blocks
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (s: number, ms: number) => timers.push(setTimeout(next(s), ms));
    if (step === 1) at(2, 700);
    if (step === 3) at(4, 500);
    if (step === 4) at(5, 1600);
    if (step === 6) at(7, 500);
    if (step === 7) at(8, 1400);
    if (step === 9) at(10, 400);
    return () => timers.forEach(clearTimeout);
  }, [step]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [step]);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{ background: T.bg }}
      {...WORLD_FADE}
    >
      {/* scanlines + vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.13]"
        style={{
          background: "repeating-linear-gradient(0deg, transparent 0 2px, #000 2px 3px)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{ background: "radial-gradient(90% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.5))" }}
      />

      <div
        ref={scroller}
        className="relative h-full overflow-y-auto px-[8vw] py-14 font-mono text-[13px] leading-relaxed"
        style={{ color: T.txt, textShadow: `0 0 8px ${T.txt}44` }}
      >
        {/* login */}
        <p>
          <span style={{ color: T.dim }}>guest@portfolio ~ $ </span>
          <Typewriter text="ssh rack-01" cps={16} startDelay={1.3} cursor onDone={next(1)} />
        </p>
        {step >= 1 && (
          <p style={{ color: T.dim }}>
            rack-01: authenticated · NVIDIA DGX Spark · uptime 41 days
          </p>
        )}

        {/* nvidia-smi */}
        {step >= 2 && (
          <p className="mt-4">
            <span style={{ color: T.dim }}>ritankar@rack-01 ~ $ </span>
            <Typewriter text="nvidia-smi --loop" cps={18} cursor onDone={next(3)} />
          </p>
        )}
        {step >= 4 && <GpuMeters onSettled={next(5)} />}

        {/* containers */}
        {step >= 5 && (
          <p className="mt-4">
            <span style={{ color: T.dim }}>ritankar@rack-01 ~ $ </span>
            <Typewriter text="docker ps" cps={18} cursor onDone={next(6)} />
          </p>
        )}
        {step >= 7 && (
          <div className="mt-1">
            <p style={{ color: T.dim }}>CONTAINER STACK STATUS</p>
            {CONTAINERS.map(([name, stack, status], i) => (
              <motion.p
                key={name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.14 }}
                className="whitespace-pre"
              >
                <span style={{ color: T.hot }}>{name.padEnd(22)}</span>
                <span>{stack.padEnd(30)}</span>
                <span style={{ color: T.dim }}>{status}</span>
              </motion.p>
            ))}
          </div>
        )}

        {/* capabilities */}
        {step >= 8 && (
          <p className="mt-4">
            <span style={{ color: T.dim }}>ritankar@rack-01 ~ $ </span>
            <Typewriter text="capabilities --list" cps={18} cursor onDone={next(9)} />
          </p>
        )}
        {step >= 10 && (
          <div className="mt-1 mb-8">
            {SKILLS.map((g, i) => (
              <motion.div
                key={g.label}
                className="mt-2"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.18, duration: 0.35 }}
              >
                <p>
                  <span style={{ color: T.warn }}>
                    [{g.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}]
                  </span>
                  <span style={{ color: T.dim }}> · service running</span>
                </p>
                <p style={{ color: T.hot }}>{g.items.join("  ·  ")}</p>
              </motion.div>
            ))}
            <motion.p
              className="mt-6"
              style={{ color: T.dim }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: SKILLS.length * 0.18 + 0.5 }}
            >
              esc — close connection
            </motion.p>
            {/* idle prompt — the session stays live, waiting on you */}
            <motion.p
              className="mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: SKILLS.length * 0.18 + 1.1 }}
            >
              <span style={{ color: T.dim }}>ritankar@rack-01 ~ $ </span>
              <span className="cursor-blink">▍</span>
            </motion.p>
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-6 right-8 z-20 font-mono text-[11px] tracking-[0.2em] uppercase transition-colors"
        style={{ color: T.dim }}
        onMouseEnter={(e) => (e.currentTarget.style.color = T.hot)}
        onMouseLeave={(e) => (e.currentTarget.style.color = T.dim)}
      >
        [ exit ]
      </button>
    </motion.div>
  );
}

/** nvidia-smi style block with live, fluctuating utilization bars */
function GpuMeters({ onSettled }: { onSettled: () => void }) {
  const [util, setUtil] = useState([0, 0, 0, 0]);
  const targets = useRef([87, 62, 94, 41]);
  const settled = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      setUtil((u) =>
        u.map((v, i) => {
          const t = targets.current[i];
          const nextV = v + (t - v) * 0.18 + (Math.random() - 0.5) * 2.2;
          return Math.max(2, Math.min(99, nextV));
        }),
      );
      // wander the targets so the machine never sits still
      if (Math.random() < 0.06) {
        targets.current = targets.current.map((t) =>
          Math.max(20, Math.min(97, t + (Math.random() - 0.5) * 26)),
        );
      }
    }, 160);
    const done = setTimeout(() => {
      if (!settled.current) {
        settled.current = true;
        onSettled();
      }
    }, 1400);
    return () => {
      clearInterval(id);
      clearTimeout(done);
    };
  }, [onSettled]);

  const bar = (v: number) => {
    const cells = 26;
    const on = Math.round((v / 100) * cells);
    return "█".repeat(on) + "░".repeat(cells - on);
  };

  return (
    <div className="mt-1 whitespace-pre">
      <p style={{ color: T.dim }}>GPU  NAME              UTIL                          MEM</p>
      {util.map((v, i) => (
        <p key={i}>
          <span style={{ color: T.dim }}>{String(i).padEnd(5)}</span>
          <span>{["A100-80G", "A100-80G", "A100-80G", "A100-80G"][i].padEnd(18)}</span>
          <span style={{ color: v > 85 ? T.warn : T.hot }}>{bar(v)}</span>
          <span style={{ color: T.dim }}> {String(Math.round(v)).padStart(3)}%</span>
        </p>
      ))}
    </div>
  );
}
