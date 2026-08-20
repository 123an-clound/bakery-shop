"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { themeToCssVars } from "@/lib/theme/css-vars";
import type { ThemeData } from "@/lib/bakery/schemas";

export interface ThemePreviewMessage {
  type: "bakery-theme-preview";
  colors: ThemeData["colors"];
  radius: string;
  fonts: ThemeData["fonts"];
}

function Listener() {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";

  useEffect(() => {
    if (!isPreview) return;

    function handleMessage(event: MessageEvent<ThemePreviewMessage>) {
      if (event.data?.type !== "bakery-theme-preview") return;
      const vars = themeToCssVars(event.data.colors, event.data.radius, event.data.fonts);
      for (const [key, value] of Object.entries(vars)) {
        document.documentElement.style.setProperty(key, String(value));
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isPreview]);

  return null;
}

/**
 * Mounted unconditionally in [locale]/layout.tsx (layouts can't read
 * searchParams server-side) — a no-op unless the page is loaded with
 * `?preview=1` inside the Theme Editor's preview iframe (mục 9.6: "cập
 * nhật realtime khi chỉnh... postMessage"). Applies unsaved color/radius/
 * font changes directly, without ever writing them to the database.
 */
export function ThemePreviewListener() {
  return (
    <Suspense fallback={null}>
      <Listener />
    </Suspense>
  );
}
