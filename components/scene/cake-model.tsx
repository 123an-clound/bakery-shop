"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useSceneStore } from "@/lib/store/scene";

const STRAWBERRY_COUNT = 5;

export function CakeModel() {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current) return;
    const { objectRotation, objectPosition } = useSceneStore.getState();
    group.current.rotation.set(
      THREE.MathUtils.lerp(group.current.rotation.x, objectRotation[0], 0.06),
      THREE.MathUtils.lerp(group.current.rotation.y, objectRotation[1], 0.06),
      THREE.MathUtils.lerp(group.current.rotation.z, objectRotation[2], 0.06),
    );
    group.current.position.set(
      THREE.MathUtils.lerp(group.current.position.x, objectPosition[0], 0.06),
      THREE.MathUtils.lerp(group.current.position.y, objectPosition[1], 0.06),
      THREE.MathUtils.lerp(group.current.position.z, objectPosition[2], 0.06),
    );
  });

  return (
    <group ref={group}>
      {/* Base tier */}
      <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.4, 1.4, 0.7, 48]} />
        <meshStandardMaterial color="#F3E4D0" roughness={0.6} />
      </mesh>
      {/* Top tier */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.0, 1.0, 0.6, 48]} />
        <meshStandardMaterial color="#FFF8EF" roughness={0.55} />
      </mesh>
      {/* Icing swirl */}
      <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.55, 0.16, 24, 48]} />
        <meshStandardMaterial color="#C89B6B" roughness={0.4} />
      </mesh>
      {/* Strawberries around the swirl */}
      {Array.from({ length: STRAWBERRY_COUNT }, (_, i) => {
        const angle = (i / STRAWBERRY_COUNT) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.9, 0.4, Math.sin(angle) * 0.9]} castShadow>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshStandardMaterial color="#D1495B" roughness={0.5} />
          </mesh>
        );
      })}
      {/* Candle */}
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 12]} />
        <meshStandardMaterial color="#F6C85F" />
      </mesh>
      <pointLight position={[0, 1.15, 0]} intensity={0.6} color="#FFD98E" distance={2} />
    </group>
  );
}
