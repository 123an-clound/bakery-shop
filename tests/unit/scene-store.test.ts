import { describe, expect, it } from "vitest";

import { useSceneStore } from "@/lib/store/scene";
import { computeSceneTransform } from "@/lib/scene/transform";

describe("useSceneStore", () => {
  it("starts in the ambient stage with the ambient transform and sceneReady false", () => {
    const state = useSceneStore.getState();
    expect(state.stage).toBe("ambient");
    expect(state).toMatchObject(computeSceneTransform(0, "ambient"));
    expect(state.sceneReady).toBe(false);
  });

  it("setStage updates the stage", () => {
    useSceneStore.getState().setStage("hero");
    expect(useSceneStore.getState().stage).toBe("hero");
    useSceneStore.getState().setStage("ambient");
  });

  it("setTransform merges the transform fields", () => {
    useSceneStore.getState().setTransform(computeSceneTransform(1, "hero"));
    expect(useSceneStore.getState()).toMatchObject(computeSceneTransform(1, "hero"));
  });

  it("setReady updates sceneReady", () => {
    useSceneStore.getState().setReady(true);
    expect(useSceneStore.getState().sceneReady).toBe(true);
  });
});
