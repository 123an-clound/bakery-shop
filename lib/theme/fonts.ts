import { slugify } from "@/lib/utils/format";

/**
 * Fonts the Theme Editor lets admins pick from (mục 9.6) — every one
 * supports the Vietnamese Google Fonts subset. The stored value in
 * `theme.fonts.heading`/`.body` is the literal label below (matches how
 * `scripts/seed.ts` already seeds "Baloo 2"/"Be Vietnam Pro"); the CSS
 * variable each font is loaded under is `--font-${slugify(label)}` — see
 * `app/[locale]/layout.tsx`, which statically loads all 6 via next/font so
 * switching fonts never needs a rebuild, and `lib/theme/css-vars.ts`, which
 * points `--font-heading`/`--font-body` at the chosen one.
 */
export const FONT_OPTIONS = ["Be Vietnam Pro", "Baloo 2", "Quicksand", "Nunito", "Lora", "Playfair Display"] as const;
export type FontOption = (typeof FONT_OPTIONS)[number];

export function fontCssVarName(label: string): string {
  return `--font-${slugify(label)}`;
}
