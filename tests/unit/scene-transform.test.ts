import { describe, expect, it } from "vitest";

import { computeSceneTransform } from "@/lib/scene/transform";

describe("computeSceneTransform — ambient stage", () => {
  it("returns the same fixed resting transform regardless of progress", () => {
    const a = computeSceneTransform(0, "ambient");
    const b = computeSceneTransform(0.7, "ambient");
    expect(a).toEqual(b);
    expect(a.objectPosition).toEqual([0, -0.2, 0]);
  });
});

describe("computeSceneTransform — hero stage", () => {
  it("matches the first keyframe at progress 0", () => {
    const t = computeSceneTransform(0, "hero");
    expect(t.cameraTarget).toEqual([0, 1.2, 5]);
    expect(t.objectRotation).toEqual([0, 0, 0]);
    expect(t.lightIntensity).toBe(1);
  });

  it("matches the last keyframe at progress 1", () => {
    const t = computeSceneTransform(1, "hero");
    expect(t.cameraTarget).toEqual([-1.2, 2, 4]);
    expect(t.objectRotation[1]).toBeCloseTo(Math.PI * 2);
    expect(t.lightIntensity).toBe(0.8);
  });

  it("interpolates halfway between the 0 and 0.5 keyframes at progress 0.25", () => {
    const t = computeSceneTransform(0.25, "hero");
    expect(t.cameraTarget[0]).toBeCloseTo(0.75); // lerp(0, 1.5, 0.5)
    expect(t.lightIntensity).toBeCloseTo(1.2); // lerp(1, 1.4, 0.5)
  });

  it("clamps out-of-range progress to the boundary keyframes", () => {
    expect(computeSceneTransform(-0.5, "hero")).toEqual(computeSceneTransform(0, "hero"));
    expect(computeSceneTransform(1.5, "hero")).toEqual(computeSceneTransform(1, "hero"));
  });
});
