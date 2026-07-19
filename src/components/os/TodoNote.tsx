"use client";

import { isTodo, todoHint } from "@/content/work";
import { OS } from "./theme";

/**
 * A visible gap.
 *
 * The authenticity rule for this portfolio is that nothing gets
 * invented — so where the real detail isn't written down yet, the
 * content file holds a marker and this renders it as an honest blank
 * rather than plausible filler. It reads as an editor's note, not as a
 * broken UI, and it's deliberately hard to miss: a gap you can see is a
 * gap that gets filled.
 */
export function TodoNote({ hint }: { hint: string }) {
  return (
    <div
      className="rounded-md px-2.5 py-2"
      style={{ background: "rgba(255,179,97,0.05)", border: "1px dashed rgba(255,179,97,0.28)" }}
    >
      <p className="font-mono text-[7.5px] tracking-[0.2em] uppercase" style={{ color: OS.accent }}>
        not written yet
      </p>
      <p className="mt-1 text-[10px] leading-snug" style={{ color: OS.dim }}>
        {hint}
      </p>
    </div>
  );
}

/** renders prose, or the gap marker if that's what the field holds */
export function Prose({ text, className }: { text: string; className?: string }) {
  if (isTodo(text)) return <TodoNote hint={todoHint(text)} />;
  return (
    <p className={`text-[11px] leading-relaxed ${className ?? ""}`} style={{ color: OS.txt }}>
      {text}
    </p>
  );
}
