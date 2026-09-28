"use client";

import dynamic from "next/dynamic";

import { usePathname } from "@/i18n/navigation";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useWeakMobile } from "@/hooks/use-weak-mobile";
import { useWebglSupport } from "@/hooks/use-webgl-support";
import { SceneController } from "./scene-controller";
import { SceneErrorBoundary } from "./scene-error-boundary";
import { SceneFallback } from "./scene-fallback";

const SceneCanvas = dynamic(() => import("./scene-canvas").then((m) => m.SceneCanvas), { ssr: false });

export function SceneRoot({ posterUrl }: { posterUrl?: string }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const webglSupported = useWebglSupport();
  const weakMobile = useWeakMobile();
  const canRender3D = webglSupported && !reducedMotion && !weakMobile;
  const isHome = pathname === "/";

  return (
    <>
      {canRender3D ? (
        <SceneErrorBoundary fallback={<SceneFallback posterUrl={posterUrl} />}>
          <SceneCanvas />
        </SceneErrorBoundary>
      ) : (
        <SceneFallback posterUrl={posterUrl} />
      )}
      {canRender3D ? <SceneController key={pathname} stage={isHome ? "hero" : "ambient"} /> : null}
    </>
  );
}
