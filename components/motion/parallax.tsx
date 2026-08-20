"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

/** Scroll-linked vertical parallax for hero/background blobs — muc 7.3. */
export function Parallax({
  children,
  speed = 0.3,
  className,
}: {
  children: React.ReactNode;
  /** Fraction of scroll distance to move — 0 = static, 1 = moves with scroll. */
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${-speed * 100}px`, `${speed * 100}px`]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
