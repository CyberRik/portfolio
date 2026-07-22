"use client";

import { isTodo, todoHint } from "@/content/work";
import { OS } from "./theme";
import { useOSDesktop } from "@/components/objects/MonitorScreen";

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
  const { isPoppedOut } = useOSDesktop();
  return (
    <div
      className={`rounded-md ${isPoppedOut ? "px-4 py-3" : "px-2.5 py-2"}`}
      style={{ background: "rgba(255,179,97,0.05)", border: "1px dashed rgba(255,179,97,0.28)" }}
    >
      <p className={`font-mono uppercase ${isPoppedOut ? "text-[11px] tracking-[0.24em]" : "text-[7.5px] tracking-[0.2em]"}`} style={{ color: OS.accent }}>
        not written yet
      </p>
      <p className={`leading-snug ${isPoppedOut ? "mt-2 text-[14px]" : "mt-1 text-[10px]"}`} style={{ color: OS.dim }}>
        {hint}
      </p>
    </div>
  );
}

/** renders prose, or the gap marker if that's what the field holds */
export function Prose({ text, className }: { text: string; className?: string }) {
  const { isPoppedOut } = useOSDesktop();
  if (isTodo(text)) return <TodoNote hint={todoHint(text)} />;
  return (
    <p className={`leading-relaxed ${isPoppedOut ? "text-[13.5px] md:text-[14.5px]" : "text-[11px]"} ${className ?? ""}`} style={{ color: OS.txt }}>
      {text}
    </p>
  );
}
