"use server";

import { updateTag } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { updateBakeryRow } from "@/lib/bakery/mutations";
import { getAdminTheme, getAdminSiteSettings } from "@/lib/bakery/admin/theme";
import { themeDataSchema, settingSiteDataSchema, type ThemeData, type SettingSiteData } from "@/lib/bakery/schemas";
import { DEFAULT_THEME } from "@/lib/theme/default-theme";
import type { AdminActionResult } from "./types";

/** Saves the whole theme record, then invalidates both caches the customer site reads from — mục 9.6.9. */
export async function saveTheme(theme: ThemeData): Promise<AdminActionResult> {
  await requireAdmin();
  const data = themeDataSchema.parse(theme);
  const current = await getAdminTheme();
  if (!current) return { ok: false, error: "not_found" };

  await updateBakeryRow(current.id, "theme", { data });
  updateTag("theme");
  return { ok: true };
}

export async function resetThemeToDefault(): Promise<AdminActionResult> {
  return saveTheme(DEFAULT_THEME);
}

/** Only the "Thương hiệu" fields the Theme Editor exposes — everything else in `setting/site` is untouched. */
export async function saveBrandSettings(input: {
  brandName: SettingSiteData["brand_name"];
  tagline?: SettingSiteData["tagline"];
  logoUrl?: string;
  faviconUrl?: string;
}): Promise<AdminActionResult> {
  await requireAdmin();
  const current = await getAdminSiteSettings();
  if (!current) return { ok: false, error: "not_found" };

  const merged = settingSiteDataSchema.parse({
    ...current.data,
    brand_name: input.brandName,
    tagline: input.tagline,
    logo_url: input.logoUrl,
    favicon_url: input.faviconUrl,
  });

  await updateBakeryRow(current.id, "setting", { data: merged });
  updateTag("settings");
  return { ok: true };
}
