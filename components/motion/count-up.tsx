"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";

/** Counts up from 0 to `value` once the element scrolls into view — muc 8.1 (story section). */
export function CountUp({
  value,
  suffix = "",
  durationMs = 1200,
}: {
  value: number;
  suffix?: string;
  durationMs?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;

    // Reduced motion -> jump straight to the final value on the first frame,
    // still inside the rAF callback rather than the effect body directly.
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const effectiveDuration = reducedMotion ? 0 : durationMs;

    const start = performance.now();
    let frame: number;
    function tick(now: number) {
      const progress = effectiveDuration === 0 ? 1 : Math.min((now - start) / effectiveDuration, 1);
      setDisplay(Math.round(progress * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, durationMs]);

  return (
    <span ref={ref}>
      {display.toLocaleString("vi-VN")}
      {suffix}
    </span>
  );
}
