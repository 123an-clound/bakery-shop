"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

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
  const [pageLoaded, setPageLoaded] = useState(false);
  useEffect(() => {
    // Let product images and critical fonts load before downloading/compiling WebGL.
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      if (typeof window.requestIdleCallback === "function") {
        idle = window.requestIdleCallback(() => setPageLoaded(true), { timeout: 2000 });
      } else {
        timer = setTimeout(() => setPageLoaded(true), 200);
      }
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      window.removeEventListener("load", schedule);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, []);
  // Keep the marketing scene on catalog routes; transactional forms need no GPU work.
  const transactional = /^\/(gio-hang|thanh-toan|tai-khoan|dat-hang-thanh-cong|tra-cuu-don-hang|dat-banh-theo-yeu-cau)(\/|$)/.test(pathname);
  const canRender3D = pageLoaded && webglSupported && !reducedMotion && !weakMobile && !transactional;
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
