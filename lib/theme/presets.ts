import type { ThemeData } from "@/lib/bakery/schemas";

/**
 * Named color presets (mục 9.6.2) — one click swaps all 8 colors. Every
 * preset keeps the same lightness pattern as the seeded "Hồng phấn" theme
 * (light primary/secondary/background, dark foreground/accent) since that
 * pattern was the one actually contrast-checked in Phase 2 (mục 7.4) —
 * `primary-foreground` always renders as the theme's `foreground`, so a
 * primary that isn't light enough against a dark foreground would fail
 * WCAG AA on every button.
 */
export const THEME_PRESETS: { name: string; colors: ThemeData["colors"] }[] = [
  {
    name: "Hồng phấn",
    colors: {
      primary: "#F7A8C4",
      secondary: "#FFE7C7",
      accent: "#7B4B2A",
      background: "#FFFBF7",
      foreground: "#3A2A22",
      muted: "#F3E9E1",
      success: "#8BC79A",
      destructive: "#E76A6A",
    },
  },
  {
    name: "Socola ấm",
    colors: {
      primary: "#E8C39E",
      secondary: "#D9B896",
      accent: "#6B4226",
      background: "#FFF8F0",
      foreground: "#3A2A1E",
      muted: "#F0E4D7",
      success: "#8BC79A",
      destructive: "#D1495B",
    },
  },
  {
    name: "Bạc hà mát",
    colors: {
      primary: "#9EE0CE",
      secondary: "#D4F1E8",
      accent: "#2E7D6B",
      background: "#F5FDFB",
      foreground: "#1F3A34",
      muted: "#E3F5EF",
      success: "#6FBF73",
      destructive: "#E5707E",
    },
  },
  {
    name: "Vàng bơ",
    colors: {
      primary: "#F6C85F",
      secondary: "#FFF1C1",
      accent: "#8A5A0B",
      background: "#FFFDF5",
      foreground: "#4A3A1A",
      muted: "#FBF0D0",
      success: "#8BC79A",
      destructive: "#E4694B",
    },
  },
  {
    name: "Tím lavender",
    colors: {
      primary: "#D3B8F5",
      secondary: "#EAD9FF",
      accent: "#6B4C9A",
      background: "#FBF8FF",
      foreground: "#34294A",
      muted: "#EFE6FA",
      success: "#8BC79A",
      destructive: "#E4708E",
    },
  },
];
