"use client";

import { useEffect } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";

import { computeSceneTransform } from "@/lib/scene/transform";
import { useSceneStore } from "@/lib/store/scene";

/** Mounted only on the homepage (see scene-root.tsx) — drives the scene
 *  transform from whole-page scroll progress for the duration it's mounted. */
export function SceneController() {
  const { scrollYProgress } = useScroll();
  const setTransform = useSceneStore((s) => s.setTransform);
  const setStage = useSceneStore((s) => s.setStage);

  useEffect(() => {
    setStage("hero");
    return () => setStage("ambient");
  }, [setStage]);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    setTransform(computeSceneTransform(progress, "hero"));
  });

  return null;
}
