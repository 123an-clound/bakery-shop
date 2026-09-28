export type SceneStage = "hero" | "ambient";
type Vec3 = [number, number, number];

export interface SceneTransform {
  cameraTarget: Vec3;
  cameraLookAt: Vec3;
  objectRotation: Vec3;
  objectPosition: Vec3;
  objectScale: number;
  lightIntensity: number;
  lightColor: Vec3;
  fillIntensity: number;
}

// The imported cake is centered and scaled to fit this sphere before animation.
export const CAKE_BOUNDING_RADIUS = 1.9;
export const SCENE_FOV = 40;
export const SCENE_TRAVEL_HALF_WIDTH = 4.8;

// Elevation is measured above the cake's horizontal plane, not above the origin
// of the original FBX. Keep the cake upright so pitch cannot cancel this angle.
const VIEWS = [
  { at: 0, elevation: 45, height: 0, objectHeight: -0.2, x: -2.8, z: 0.12, scale: 0.9 },
  { at: 0.22, elevation: 72, height: 0.22, objectHeight: 0.1, x: -1.6, z: -0.1, scale: 0.96 },
  { at: 0.48, elevation: 48, height: 0.08, objectHeight: 0.12, x: 0.08, z: -0.22, scale: 1.06 },
  { at: 0.74, elevation: 30, height: -0.14, objectHeight: -0.05, x: 1.6, z: 0.1, scale: 1.16 },
  { at: 1, elevation: 58, height: 0, objectHeight: 0.08, x: 2.8, z: 0.03, scale: 1.24 },
];

export function computeSceneTransform(progress: number, stage: SceneStage): SceneTransform {
  const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  const next = VIEWS.findIndex((view) => view.at >= p);
  const a = VIEWS[Math.max(0, next - 1)]!;
  const b = VIEWS[Math.max(0, next)]!;
  const t = a === b ? 0 : (p - a.at) / (b.at - a.at);
  const eased = t * t * (3 - 2 * t);
  const elevation = (a.elevation + (b.elevation - a.elevation) * eased) * Math.PI / 180;
  const height = a.height + (b.height - a.height) * eased;
  const objectHeight = a.objectHeight + (b.objectHeight - a.objectHeight) * eased;
  const x = a.x + (b.x - a.x) * eased;
  const z = a.z + (b.z - a.z) * eased;
  const scale = a.scale + (b.scale - a.scale) * eased;
  const distance = stage === "hero" ? 6.8 : 7.4;

  return {
    cameraTarget: [0, height + Math.sin(elevation) * distance, Math.cos(elevation) * distance],
    cameraLookAt: [0, height, 0],
    objectRotation: [0, -0.28 + p * Math.PI * 2, 0],
    // A gentle S-curve gives the product physical presence. The camera stays
    // above the cake while it glides nearer, then eases back into frame.
    objectPosition: [x, objectHeight, z],
    objectScale: scale,
    lightIntensity: 1 + Math.sin(p * Math.PI) * 0.25,
    lightColor: [1, 0.9 - p * 0.15, 0.76 - p * 0.18],
    fillIntensity: 0.8 + Math.sin(p * Math.PI) * 0.25,
  };
}

/** Leave space for the full cake (including its screen offset) at every aspect ratio. */
export function sceneFramingDistance(aspect: number, horizontalOffset: number, modelScale = 1): number {
  const halfVerticalFov = SCENE_FOV * Math.PI / 360;
  const halfHorizontalFov = Math.atan(Math.tan(halfVerticalFov) * Math.max(0.25, aspect));
  const radius = CAKE_BOUNDING_RADIUS * modelScale;
  return Math.max(
    radius / Math.sin(halfVerticalFov),
    (radius + Math.abs(horizontalOffset)) / Math.sin(halfHorizontalFov),
  ) * 1.08;
}
