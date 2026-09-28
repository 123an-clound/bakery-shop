"use client";

import { useEffect } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";

import { computeSceneTransform, type SceneStage } from "@/lib/scene/transform";
import { useSceneStore } from "@/lib/store/scene";

/** Read the current document scroll after navigation/restoration.
 * Only this controller remounts per route; the canvas and model stay alive. */
export function SceneController({ stage }: { stage: SceneStage }) {
  const { scrollYProgress } = useScroll();
  const setTransform = useSceneStore((s) => s.setTransform);
  const setStage = useSceneStore((s) => s.setStage);

  useEffect(() => {
    setStage(stage);
    function syncPosition() {
      const range = document.documentElement.scrollHeight - window.innerHeight;
      setTransform(computeSceneTransform(range > 0 ? window.scrollY / range : 0, stage));
    }
    syncPosition();
    const frame = requestAnimationFrame(syncPosition);
    return () => cancelAnimationFrame(frame);
  }, [setStage, setTransform, stage]);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    setTransform(computeSceneTransform(progress, stage));
  });

  return null;
}
