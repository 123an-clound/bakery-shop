import type { CSSProperties } from "react";

import type { ThemeData } from "@/lib/bakery/schemas";
import { fontCssVarName } from "./fonts";

/**
 * Maps the 8 admin-editable `theme.colors` keys (+ radius, + fonts) onto the
 * CSS custom properties declared in app/globals.css `:root`. Applied as an
 * inline style on <html> so it overrides the file's fallback values with
 * zero rebuild — see the comment at the top of globals.css for why this only
 * works because every Tailwind `@theme inline` entry is a `var(--x)` alias,
 * not a literal.
 *
 * Fonts: `--font-heading`/`--font-body` are pointed at `var(--font-<slug>)`
 * rather than a literal family name — app/[locale]/layout.tsx statically
 * loads all 6 Theme Editor font choices via next/font, each under its own
 * `--font-<slug>` variable, so this only ever *selects* one, never fetches
 * an external stylesheet.
 */
export function themeToCssVars(colors: ThemeData["colors"], radius: string, fonts?: ThemeData["fonts"]): CSSProperties {
  return {
    "--background": colors.background,
    "--foreground": colors.foreground,
    "--primary": colors.primary,
    "--primary-foreground": colors.foreground,
    "--secondary": colors.secondary,
    "--secondary-foreground": colors.foreground,
    "--muted": colors.muted,
    "--muted-foreground": colors.foreground,
    "--accent": colors.muted,
    "--accent-foreground": colors.foreground,
    "--brand-accent": colors.accent,
    "--destructive": colors.destructive,
    "--success": colors.success,
    "--radius": radius,
    "--ring": colors.primary,
    ...(fonts
      ? {
          "--font-heading": `var(${fontCssVarName(fonts.heading)})`,
          "--font-body": `var(${fontCssVarName(fonts.body)})`,
        }
      : {}),
  } as CSSProperties;
}
