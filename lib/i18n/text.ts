import type { Locale } from "@/lib/bakery/types";

/** `{ vi: string; en?: string }` -> resolved string for the given locale — muc 10. */
export function t(field: { vi: string; en?: string } | undefined | null, locale: Locale): string {
  if (!field) return "";
  if (locale === "en" && field.en) return field.en;
  return field.vi;
}
