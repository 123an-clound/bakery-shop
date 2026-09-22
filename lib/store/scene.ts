import { create } from "zustand";

import { computeSceneTransform, type SceneStage, type SceneTransform } from "@/lib/scene/transform";

interface SceneState extends SceneTransform {
  stage: SceneStage;
  sceneReady: boolean;
  setStage: (stage: SceneStage) => void;
  setTransform: (transform: SceneTransform) => void;
  setReady: (ready: boolean) => void;
}

/**
 * Derived UI state (scroll position, route), not user data — deliberately
 * NOT persisted (unlike lib/store/cart.ts), resets fine every session.
 */
export const useSceneStore = create<SceneState>((set) => ({
  stage: "ambient",
  ...computeSceneTransform(0, "ambient"),
  sceneReady: false,
  setStage: (stage) => set({ stage }),
  setTransform: (transform) => set(transform),
  setReady: (sceneReady) => set({ sceneReady }),
}));
