"use client";

import { Button } from "@/components/ui/button";
import { fireConfetti } from "@/components/motion/confetti";

export function ConfettiDemoButton() {
  return (
    <Button variant="secondary" className="rounded-full" onClick={() => fireConfetti()}>
      🎉 Bấm để bắn confetti
    </Button>
  );
}
