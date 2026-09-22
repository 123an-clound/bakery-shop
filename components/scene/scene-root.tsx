"use client";

import dynamic from "next/dynamic";

import { usePathname } from "@/i18n/navigation";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useWebglSupport } from "@/hooks/use-webgl-support";
import { SceneController } from "./scene-controller";
import { SceneErrorBoundary } from "./scene-error-boundary";
import { SceneFallback } from "./scene-fallback";

const SceneCanvas = dynamic(() => import("./scene-canvas").then((m) => m.SceneCanvas), { ssr: false });

export function SceneRoot({ posterUrl }: { posterUrl?: string }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const webglSupported = useWebglSupport();
  const canRender3D = webglSupported && !reducedMotion;
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
      {isHome && canRender3D ? <SceneController /> : null}
    </>
  );
}
