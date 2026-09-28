"use client";

import { useEffect, useMemo, type RefObject } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

import { CAKE_BOUNDING_RADIUS } from "@/lib/scene/transform";

// Web build of cake-full-detail.glb (gltf-transform: simplify ratio 0.05 /
// error 0.0005 + meshopt): 18.7 MB / 13M rendered vertices → 3.2 MB / 1.3M.
// The full-detail source froze the main thread on software-GL devices.
const MODEL_URL = "/models/cake/cake-web.glb";

/** Optimized high-detail cake supplied by the bakery project. */
export function CakeModel({ groupRef }: { groupRef: RefObject<THREE.Group | null> }) {
  const { scene: model } = useGLTF(MODEL_URL);
  const normalized = useMemo(() => {
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = CAKE_BOUNDING_RADIUS / bounds.getBoundingSphere(new THREE.Sphere()).radius;
    return { scale, offset: center.multiplyScalar(-scale) };
  }, [model]);

  useEffect(() => {
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;

      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (material instanceof THREE.MeshStandardMaterial) {
          material.envMapIntensity = 0.95;
          material.roughness = Math.min(material.roughness || 0.6, 0.72);
          material.needsUpdate = true;
        } else if (material instanceof THREE.MeshPhongMaterial) {
          const color = material.color;
          color.r = Math.min(1, Math.pow(color.r, 0.9) * 1.03);
          color.g = Math.min(1, Math.pow(color.g, 0.9) * 1.03);
          color.b = Math.min(1, Math.pow(color.b, 0.9) * 1.03);
          material.shininess = Math.max(material.shininess, 56);
          material.flatShading = false;
          material.needsUpdate = true;
        }
      }
    });
  }, [model]);

  return (
    <group ref={groupRef} name="cake-presentation">
      <group scale={normalized.scale} position={normalized.offset}>
        {/* useGLTF owns this shared cached geometry; only the wrapper is animated. */}
        <primitive object={model} dispose={null} />
      </group>
    </group>
  );
}

useGLTF.preload(MODEL_URL);
