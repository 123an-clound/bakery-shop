import { describe, expect, it } from "vitest";
import { Euler, Vector3, PerspectiveCamera, Frustum, Matrix4 } from "three";

import { CAKE_BOUNDING_RADIUS, SCENE_FOV, SCENE_TRAVEL_HALF_WIDTH, computeSceneTransform, sceneFramingDistance } from "@/lib/scene/transform";

describe.each(["hero", "ambient"] as const)("%s viewing coverage", (stage) => {
  it("shows the top clearly and never presents the underside over the entire scroll", () => {
    const elevations: number[] = [];
    for (let i = 0; i <= 200; i++) {
      const pose = computeSceneTransform(i / 200, stage);
      const up = new Vector3(0, 1, 0).applyEuler(new Euler(...pose.objectRotation));
      const view = new Vector3(...pose.cameraTarget).sub(new Vector3(...pose.objectPosition)).normalize();
      const elevation = Math.asin(up.dot(view)) * 180 / Math.PI;
      elevations.push(elevation);
      expect(elevation).toBeGreaterThanOrEqual(10);
    }
    expect(Math.max(...elevations)).toBeGreaterThanOrEqual(65);
    expect(Math.max(...elevations) - Math.min(...elevations)).toBeGreaterThanOrEqual(30);
  });

  it("reveals all four sides in order and completes one full turn", () => {
    const start = computeSceneTransform(0, stage).objectRotation[1];
    for (const p of [0.25, 0.5, 0.75, 1]) {
      expect(computeSceneTransform(p, stage).objectRotation[1] - start).toBeCloseTo(2 * Math.PI * p);
    }
  });

  it("has visible vertical travel without tipping the cake", () => {
    const heights = Array.from({ length: 101 }, (_, i) => {
      const pose = computeSceneTransform(i / 100, stage);
      expect(pose.objectRotation[0]).toBe(0);
      expect(pose.objectRotation[2]).toBe(0);
      return pose.objectPosition[1];
    });
    expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(0.2);
  });

  it("adds a restrained zoom and a curved product trajectory", () => {
    const samples = Array.from({ length: 101 }, (_, i) => computeSceneTransform(i / 100, stage));
    const scales = samples.map((pose) => pose.objectScale);
    const xPositions = samples.map((pose) => pose.objectPosition[0]);
    const zPositions = samples.map((pose) => pose.objectPosition[2]);

    expect(Math.max(...scales)).toBeGreaterThan(1.1);
    expect(Math.min(...scales)).toBeLessThanOrEqual(0.9);
    for (let i = 1; i < scales.length; i += 1) {
      expect(scales[i]!).toBeGreaterThanOrEqual(scales[i - 1]!);
      expect(xPositions[i]!).toBeGreaterThanOrEqual(xPositions[i - 1]!);
    }
    expect(xPositions[0]!).toBeLessThan(-1);
    expect(xPositions.at(-1)!).toBeGreaterThan(1);
    expect(Math.max(...xPositions) - Math.min(...xPositions)).toBeGreaterThan(0.3);
    expect(Math.max(...zPositions) - Math.min(...zPositions)).toBeGreaterThan(0.2);
  });

  it("handles document overscroll and non-finite values safely", () => {
    expect(computeSceneTransform(-0.5, stage)).toEqual(computeSceneTransform(0, stage));
    expect(computeSceneTransform(1.5, stage)).toEqual(computeSceneTransform(1, stage));
    expect(computeSceneTransform(NaN, stage)).toEqual(computeSceneTransform(0, stage));
  });

  it.each([[1920, 1080], [1366, 768], [1024, 768], [768, 1024], [390, 844]])(
    "keeps the full normalized cake inside the camera at %dx%d",
    (width, height) => {
      const camera = new PerspectiveCamera(SCENE_FOV, width / height, 0.1, 1000);
      for (let i = 0; i <= 100; i++) {
        const pose = computeSceneTransform(i / 100, stage);
        const focus = new Vector3(...pose.cameraLookAt);
        const isNarrow = width < 640;
        const x = width < 640
          ? pose.objectPosition[0] * 0.28
          : width < 1024
            ? pose.objectPosition[0] * 0.55
            : pose.objectPosition[0];
        const framingX = width >= 1024 ? SCENE_TRAVEL_HALF_WIDTH : x;
        const y = isNarrow ? pose.objectPosition[1] - 0.85 : pose.objectPosition[1];
        const offset = new Vector3(...pose.cameraTarget).sub(focus);
        offset.setLength(Math.max(
          offset.length(),
          sceneFramingDistance(width / height, framingX, 1.26) * (isNarrow ? 1.25 : 1),
        ));
        camera.position.copy(focus).add(offset);
        camera.lookAt(focus);
        camera.updateMatrixWorld();
        const frustum = new Frustum().setFromProjectionMatrix(new Matrix4().multiplyMatrices(
          camera.projectionMatrix, camera.matrixWorldInverse,
        ));
        const center = new Vector3(x, y, pose.objectPosition[2]);
        // Every frustum plane must contain the entire bounding sphere, not
        // merely intersect it. This catches clipping while the cake rotates.
        for (const plane of frustum.planes) {
          expect(plane.distanceToPoint(center)).toBeGreaterThan(CAKE_BOUNDING_RADIUS * pose.objectScale);
        }
      }
    },
  );
});
