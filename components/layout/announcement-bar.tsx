"use client";

import { useState, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { ThemeData } from "@/lib/bakery/schemas";

const STORAGE_KEY = "bakery-announcement-dismissed";

function subscribe() {
  // localStorage doesn't need a live subscription here — the value only
  // changes via this component's own click handler (see `justClosed` below).
  return () => {};
}

/**
 * Reads whether this exact announcement text was dismissed before.
 * `getServerSnapshot` returns `false` so the server render and the first
 * client render (pre-hydration) agree — avoids a hydration mismatch, unlike
 * branching on `typeof window` inside a lazy useState initializer.
 */
function usePersistedDismissed(text: string) {
  return useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(STORAGE_KEY) === text,
    () => false,
  );
}

export function AnnouncementBar({ config }: { config: ThemeData["announcement_bar"] }) {
  const t = useTranslations("AnnouncementBar");
  const persistedDismissed = usePersistedDismissed(config.text.vi);
  const [justClosed, setJustClosed] = useState(false);
  const dismissed = persistedDismissed || justClosed;

  if (!config.enabled || dismissed) return null;

  const text = <span>{config.text.vi}</span>;

  return (
    <div className="bg-primary text-primary-foreground relative flex items-center justify-center px-4 py-2 text-sm font-medium">
      {config.href ? (
        <Link href={config.href} className="hover:underline">
          {text}
        </Link>
      ) : (
        text
      )}
      <button
        type="button"
        aria-label={t("close")}
        className="absolute right-3 rounded-full p-1 hover:bg-black/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        onClick={() => {
          window.localStorage.setItem(STORAGE_KEY, config.text.vi);
          setJustClosed(true);
        }}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
