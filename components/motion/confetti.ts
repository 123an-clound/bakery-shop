"use client";

import confetti from "canvas-confetti";

/**
 * Small confetti burst — muc 7.3 ("Thêm vào giỏ": ảnh bay + confetti nhỏ;
 * mục 8.7 "Đặt hàng thành công": confetti chúc mừng). Respects
 * prefers-reduced-motion and the theme's `confetti_on_add_to_cart` flag —
 * callers pass `enabled` from `theme.effects`.
 */
export function fireConfetti(options?: { enabled?: boolean; particleCount?: number }) {
  const enabled = options?.enabled ?? true;
  if (!enabled) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  void confetti({
    particleCount: options?.particleCount ?? 60,
    spread: 70,
    startVelocity: 35,
    origin: { y: 0.7 },
    colors: ["#F7A8C4", "#FFE7C7", "#A8DCC4", "#7B4B2A"],
  });
}
