"use client";

import { useEffect, useRef, useState } from "react";

/** Types text character by character, then calls onDone once. */
export function Typewriter({
  text,
  cps = 28,
  startDelay = 0,
  className,
  cursor = false,
  onDone,
}: {
  text: string;
  /** characters per second */
  cps?: number;
  startDelay?: number;
  className?: string;
  cursor?: boolean;
  onDone?: () => void;
}) {
  const [n, setN] = useState(0);
  const doneFired = useRef(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const t = setTimeout(() => {
      interval = setInterval(() => {
        setN((prev) => {
          if (prev >= text.length) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / cps);
    }, startDelay * 1000);
    return () => {
      clearTimeout(t);
      if (interval) clearInterval(interval);
    };
  }, [text, cps, startDelay]);

  useEffect(() => {
    if (n >= text.length && !doneFired.current) {
      doneFired.current = true;
      onDone?.();
    }
  }, [n, text.length, onDone]);

  return (
    <span className={className}>
      {text.slice(0, n)}
      {cursor && n < text.length && <span className="cursor-blink">▍</span>}
    </span>
  );
}
