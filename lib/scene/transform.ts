export type SceneStage = "hero" | "ambient";

export interface SceneTransform {
  cameraTarget: [number, number, number];
  objectRotation: [number, number, number];
  objectPosition: [number, number, number];
  lightIntensity: number;
}

/** Static resting pose shown on every non-homepage route. */
const AMBIENT_TRANSFORM: SceneTransform = {
  cameraTarget: [0, 1, 6],
  objectRotation: [0, 0.4, 0],
  objectPosition: [0, -0.2, 0],
  lightIntensity: 0.7,
};

/**
 * Homepage scroll storytelling beats. `at` is scrollYProgress (0-1).
 * computeSceneTransform interpolates linearly between the two keyframes
 * bracketing the current progress.
 */
const HERO_KEYFRAMES: { at: number; transform: SceneTransform }[] = [
  {
    at: 0,
    transform: { cameraTarget: [0, 1.2, 5], objectRotation: [0, 0, 0], objectPosition: [0, 0, 0], lightIntensity: 1 },
  },
  {
    at: 0.5,
    transform: {
      cameraTarget: [1.5, 1.6, 3.5],
      objectRotation: [0, Math.PI, 0],
      objectPosition: [0, 0.3, 0],
      lightIntensity: 1.4,
    },
  },
  {
    at: 1,
    transform: {
      cameraTarget: [-1.2, 2, 4],
      objectRotation: [0, Math.PI * 2, 0],
      objectPosition: [0, 0, 0],
      lightIntensity: 0.8,
    },
  },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpTransform(a: SceneTransform, b: SceneTransform, t: number): SceneTransform {
  return {
    cameraTarget: [
      lerp(a.cameraTarget[0], b.cameraTarget[0], t),
      lerp(a.cameraTarget[1], b.cameraTarget[1], t),
      lerp(a.cameraTarget[2], b.cameraTarget[2], t),
    ],
    objectRotation: [
      lerp(a.objectRotation[0], b.objectRotation[0], t),
      lerp(a.objectRotation[1], b.objectRotation[1], t),
      lerp(a.objectRotation[2], b.objectRotation[2], t),
    ],
    objectPosition: [
      lerp(a.objectPosition[0], b.objectPosition[0], t),
      lerp(a.objectPosition[1], b.objectPosition[1], t),
      lerp(a.objectPosition[2], b.objectPosition[2], t),
    ],
    lightIntensity: lerp(a.lightIntensity, b.lightIntensity, t),
  };
}

export function computeSceneTransform(progress: number, stage: SceneStage): SceneTransform {
  if (stage === "ambient") return AMBIENT_TRANSFORM;

  const clamped = Math.min(1, Math.max(0, progress));
  const nextIndex = HERO_KEYFRAMES.findIndex((k) => k.at >= clamped);
  if (nextIndex <= 0) return HERO_KEYFRAMES[0]!.transform;

  // If we're exactly at a keyframe position, return it directly (avoids floating-point interpolation errors)
  if (HERO_KEYFRAMES[nextIndex]!.at === clamped) return HERO_KEYFRAMES[nextIndex]!.transform;

  const prev = HERO_KEYFRAMES[nextIndex - 1]!;
  const next = HERO_KEYFRAMES[nextIndex]!;
  const t = (clamped - prev.at) / (next.at - prev.at);
  return lerpTransform(prev.transform, next.transform, t);
}
