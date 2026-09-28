"use client";

import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";

import { useSceneStore } from "@/lib/store/scene";
import { SCENE_FOV, sceneFramingDistance } from "@/lib/scene/transform";
import { CakeModel } from "./cake-model";

const MODEL_SCALE_BOOST = 4.6;
const DESKTOP_FRAMING_X = 3.9;

/** Animate the camera, its focus and the upright cake together in one frame.
 * Elevation is relative to the centered cake, including during route transitions. */
function SceneRig({ cake }: { cake: RefObject<THREE.Group | null> }) {
  const { camera, size } = useThree();
  const light = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.PointLight>(null);
  const initialized = useRef(false);
  const cakeInitialized = useRef(false);
  const autoRotation = useRef(0);
  const lastScrollRotation = useRef<number | null>(null);
  const idleTime = useRef(0);
  const vectors = useMemo(() => ({
    focus: new THREE.Vector3(),
    targetFocus: new THREE.Vector3(),
    position: new THREE.Vector3(),
    offset: new THREE.Vector3(),
    color: new THREE.Color(),
  }), []);

  // R3F owns the camera object; mutating it inside the render loop is the
  // intended imperative escape hatch for smooth WebGL motion.
  // eslint-disable-next-line react-hooks/immutability
  useFrame((_, delta) => {
    const pose = useSceneStore.getState();
    const alpha = initialized.current ? 1 - Math.exp(-6 * Math.min(delta, 0.05)) : 1;
    vectors.targetFocus.fromArray(pose.cameraLookAt);
    vectors.focus.lerp(vectors.targetFocus, alpha);

    // Pull back on narrow viewports without lowering the elevation angle.
    const isNarrow = size.width < 640;
    // The transform path is monotonic for predictable scroll interpolation;
    // render it mirrored so the opening hero places the cake on the right of
    // the copy, then brings it across the background as the page progresses.
    const objectX = -pose.objectPosition[0];
    const responsiveX = size.width < 640
      ? objectX * 0.28
      : size.width < 1024
        ? objectX * 0.55
        : objectX;
    // Keep a stable frame on desktop without reserving excess space beyond the
    // cake's actual ±2.8 travel path; framing against each position would pump
    // the camera in and out as the user scrolls.
    const framingX = size.width >= 1024 ? DESKTOP_FRAMING_X : responsiveX;
    // On phones the copy and primary actions occupy the visual center. Keep the
    // cake in the same camera story, but lower it so it reads as a product
    // object instead of sitting on top of the headline.
    const responsiveY = isNarrow ? pose.objectPosition[1] - 0.85 : pose.objectPosition[1];
    vectors.offset.fromArray(pose.cameraTarget).sub(vectors.targetFocus);
    vectors.offset.setLength(Math.max(
      vectors.offset.length(),
      sceneFramingDistance(size.width / size.height, framingX, 1.45) * (isNarrow ? 1.25 : 1),
    ));
    vectors.position.copy(vectors.targetFocus).add(vectors.offset);
    camera.position.lerp(vectors.position, alpha);

    if (cake.current) {
      const cakeAlpha = cakeInitialized.current ? alpha : 1;
      vectors.position.set(responsiveX, responsiveY, pose.objectPosition[2]);
      cake.current.position.lerp(vectors.position, cakeAlpha);
      cake.current.scale.setScalar(
        THREE.MathUtils.lerp(cake.current.scale.x, pose.objectScale * MODEL_SCALE_BOOST, cakeAlpha),
      );
      // Scroll drives the main rotation. Once scrolling stops, add a gentle
      // in-place 360° spin without changing the camera or layout.
      const scrollRotation = pose.objectRotation[1];
      const previousScrollRotation = lastScrollRotation.current;
      const scrollChanged = previousScrollRotation !== null && Math.abs(scrollRotation - previousScrollRotation) > 0.0005;
      lastScrollRotation.current = scrollRotation;
      if (scrollChanged) {
        idleTime.current = 0;
        autoRotation.current = 0;
      } else {
        idleTime.current += delta;
        if (idleTime.current > 0.25) autoRotation.current += delta * 0.45;
      }
      // Pitch/roll are always zero: the requested 45° view comes from the
      // camera, so the cake remains upright and its base stays visible.
      cake.current.rotation.set(0, THREE.MathUtils.lerp(cake.current.rotation.y, scrollRotation + autoRotation.current, cakeAlpha), 0);
      cakeInitialized.current = true;
    }

    // Guard the upper hemisphere against the actual center after damping.
    const centerY = cake.current?.position.y ?? pose.objectPosition[1];
    // eslint-disable-next-line react-hooks/immutability
    camera.position.y = Math.max(camera.position.y, centerY + 0.5, vectors.focus.y + 0.5);
    camera.lookAt(vectors.focus);
    initialized.current = true;

    vectors.color.setRGB(...pose.lightColor);
    if (light.current) {
      light.current.intensity = THREE.MathUtils.lerp(light.current.intensity, pose.lightIntensity, alpha);
      light.current.color.lerp(vectors.color, alpha);
    }
    if (fill.current) {
      fill.current.intensity = THREE.MathUtils.lerp(fill.current.intensity, pose.fillIntensity, alpha);
      fill.current.color.lerp(vectors.color, alpha);
    }
  });

  return (
    <>
      <directionalLight ref={light} position={[3, 5, 2]} intensity={1.1} castShadow />
      <pointLight ref={fill} position={[-3, 3, 3]} intensity={0.8} distance={10} decay={2} />
    </>
  );
}

export function SceneCanvas() {
  const cake = useRef<THREE.Group>(null);
  const ready = useSceneStore((state) => state.sceneReady);

  useEffect(() => {
    // Mark the canvas as mounted immediately. The GLB may arrive later on a
    // cold cache; keeping the canvas in the DOM prevents a layout/fallback
    // swap while the model streams in.
    useSceneStore.getState().setReady(true);
    return () => useSceneStore.getState().setReady(false);
  }, []);

  return (
    <div data-testid="scene-canvas" data-ready={ready} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 5.5, 5], fov: SCENE_FOV }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
        shadows="percentage"
        style={{ pointerEvents: "none" }}
      >
        <AdaptiveDpr />
        <ambientLight intensity={0.55} />
        <SceneRig cake={cake} />
        <Suspense fallback={null}>
          {/* Locally generated studio lighting; no remote HDRI requests. */}
          <Environment resolution={256} frames={1} environmentIntensity={0.62}>
            <Lightformer form="rect" intensity={4.5} position={[2, 4, 4]} scale={[4, 4]} />
            <Lightformer form="rect" intensity={2.8} position={[-4, 1, 2]} rotation={[0, Math.PI / 2, 0]} scale={[3, 5]} />
            <Lightformer form="ring" intensity={2.4} position={[0, 5, -3]} scale={2.5} />
          </Environment>
          <CakeModel groupRef={cake} />
        </Suspense>
      </Canvas>
    </div>
  );
}
