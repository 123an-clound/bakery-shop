"use client";

import "lenis/dist/lenis.css";

import { useSyncExternalStore } from "react";
import { ReactLenis } from "lenis/react";

function subscribeReducedMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Server + first client paint assume motion is allowed — matched, then
 *  corrected right after hydration if the real preference is "reduce". */
function getReducedMotionServerSnapshot() {
  return false;
}

/**
 * Smooth scroll — muc 7.3 KE-HOACH-DU-AN.md (lerp 0.1). Skipped entirely when
 * the user prefers reduced motion, or the `theme.effects.smooth_scroll` flag
 * is off (mục 7.3: "BAT BUOC ton trong prefers-reduced-motion").
 */
export function LenisProvider({
  children,
  enabled = true,
}: {
  children: React.ReactNode;
  enabled?: boolean;
}) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  if (!enabled || reducedMotion) {
    return children;
  }

  return (
    <ReactLenis root options={{ lerp: 0.1, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
