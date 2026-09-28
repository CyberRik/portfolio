"use client";

import { useEffect, useState } from "react";
import { PROFILE } from "@/content/portfolio";
import type { ProfileStats as Stats } from "@/app/api/stats/route";

/**
 * The LeetCode / GitHub line under the identity chip. Links render
 * immediately; the live solved count (from /api/stats, refreshed hourly on
 * the server) fades in once it arrives and is simply left out if LeetCode
 * is down, so the line never shows a placeholder or a zero.
 */
export function ProfileStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((s: Stats | null) => alive && setStats(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const lc = stats?.leetcode;

  return (
    <p className="pointer-events-auto mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[8.5px] tracking-[0.14em] uppercase sm:text-[10px] sm:tracking-[0.2em]">
      <a
        href={`https://leetcode.com/u/${PROFILE.leetcode}/`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#d6c6ab] transition-colors hover:text-[#ffd9a8]"
        title={lc ? `Easy ${lc.easy} · Medium ${lc.medium} · Hard ${lc.hard}` : undefined}
      >
        LeetCode
        {lc && (
          <span className="animate-[stat-fade_0.6s_ease] text-[#ffd9a8]"> {lc.solved} solved</span>
        )}{" "}
        ↗
      </a>
      <span className="text-[#8a7c66]" aria-hidden>
        ·
      </span>
      <a
        href={`https://github.com/${PROFILE.github}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#d6c6ab] transition-colors hover:text-[#ffd9a8]"
      >
        GitHub ↗
      </a>
    </p>
  );
}
