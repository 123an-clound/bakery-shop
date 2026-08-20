import type { CSSProperties } from "react";

import type { ThemeData } from "@/lib/bakery/schemas";

/**
 * Maps the 8 admin-editable `theme.colors` keys (+ radius) onto the CSS custom
 * properties declared in app/globals.css `:root`. Applied as an inline style
 * on <html> so it overrides the file's fallback values with zero rebuild —
 * see the comment at the top of globals.css for why this only works because
 * every Tailwind `@theme inline` entry is a `var(--x)` alias, not a literal.
 */
export function themeToCssVars(colors: ThemeData["colors"], radius: string): CSSProperties {
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
  } as CSSProperties;
}
