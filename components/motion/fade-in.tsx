"use client";

import { motion } from "motion/react";

/** Fade + slide-up on scroll into view (plan.md 2.4: smooth "fade in up"). */
export function FadeIn({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Wraps a list of children, staggering each FadeIn by `staggerMs`. */
export function FadeInStagger({
  children,
  staggerMs = 60,
  className,
}: {
  children: React.ReactNode[];
  staggerMs?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <FadeIn key={i} delay={(i * staggerMs) / 1000}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
}
