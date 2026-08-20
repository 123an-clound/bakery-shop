"use server";

import { updateTag } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createBakeryRow, updateBakeryRow, deleteBakeryRow } from "@/lib/bakery/mutations";
import { bannerDataSchema, type BannerData } from "@/lib/bakery/schemas";
import { reorderBanners as reorderBannersDb } from "@/lib/bakery/admin/banners";
import type { AdminActionResult } from "./types";

export async function createBanner(input: { data: BannerData; status: "active" | "draft" }): Promise<AdminActionResult> {
  await requireAdmin();
  const data = bannerDataSchema.parse(input.data);
  const row = await createBakeryRow({ type: "banner", data, status: input.status });
  updateTag("banners");
  return { ok: true, id: row.id };
}

export async function updateBanner(id: number, input: { data: BannerData; status: "active" | "draft" }): Promise<AdminActionResult> {
  await requireAdmin();
  const data = bannerDataSchema.parse(input.data);
  await updateBakeryRow(id, "banner", { data, status: input.status });
  updateTag("banners");
  return { ok: true, id };
}

export async function deleteBanner(id: number): Promise<AdminActionResult> {
  await requireAdmin();
  await deleteBakeryRow(id, "banner");
  updateTag("banners");
  return { ok: true };
}

export async function reorderBanners(orderedIds: number[]): Promise<AdminActionResult> {
  await requireAdmin();
  await reorderBannersDb(orderedIds);
  updateTag("banners");
  return { ok: true };
}
