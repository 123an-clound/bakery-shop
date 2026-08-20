"use server";

import { updateTag } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createBakeryRow, updateBakeryRow, deleteBakeryRow } from "@/lib/bakery/mutations";
import { categoryDataSchema, type CategoryData } from "@/lib/bakery/schemas";
import { isCategorySlugTaken, reorderCategories as reorderCategoriesDb } from "@/lib/bakery/admin/categories";
import { slugify } from "@/lib/utils/format";
import type { AdminActionResult } from "./types";

export async function createCategory(input: {
  data: CategoryData;
  status: "active" | "draft";
  slug?: string;
}): Promise<AdminActionResult> {
  await requireAdmin();
  const data = categoryDataSchema.parse(input.data);

  let slug = input.slug?.trim() || slugify(data.name.vi);
  if (await isCategorySlugTaken(slug)) slug = `${slug}-${Date.now().toString(36)}`;

  const row = await createBakeryRow({ type: "category", data, slug, status: input.status });
  updateTag("categories");
  return { ok: true, id: row.id };
}

export async function updateCategory(
  id: number,
  input: { data: CategoryData; status: "active" | "draft"; slug?: string },
): Promise<AdminActionResult> {
  await requireAdmin();
  const data = categoryDataSchema.parse(input.data);

  let slug = input.slug?.trim() || slugify(data.name.vi);
  if (await isCategorySlugTaken(slug, id)) slug = `${slug}-${Date.now().toString(36)}`;

  await updateBakeryRow(id, "category", { data, status: input.status, slug });
  updateTag("categories");
  return { ok: true, id };
}

export async function deleteCategory(id: number): Promise<AdminActionResult> {
  await requireAdmin();
  await deleteBakeryRow(id, "category");
  updateTag("categories");
  updateTag("products");
  return { ok: true };
}

export async function reorderCategories(orderedIds: number[]): Promise<AdminActionResult> {
  await requireAdmin();
  await reorderCategoriesDb(orderedIds);
  updateTag("categories");
  return { ok: true };
}
