"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";

import { CakeModel } from "./cake-model";

// No drei <Environment> HDRI here on purpose — it fetches a preset texture
// from a CDN at runtime, which would reintroduce the exact external-asset
// dependency the spec ruled out for the cake model itself. Plain
// ambient/directional/point lights (the point light lives in CakeModel) are
// enough for a stylized procedural scene.
export function SceneCanvas() {
  return (
    <div data-testid="scene-canvas" aria-hidden="true" className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 1.2, 5], fov: 40 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <AdaptiveDpr />
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 2]} intensity={1.1} castShadow />
        <Suspense fallback={null}>
          <CakeModel />
        </Suspense>
      </Canvas>
    </div>
  );
}
