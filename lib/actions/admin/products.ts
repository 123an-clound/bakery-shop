"use server";

import { updateTag } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createBakeryRow, updateBakeryRow, deleteBakeryRow } from "@/lib/bakery/mutations";
import { productDataSchema, type ProductData } from "@/lib/bakery/schemas";
import { isProductSlugTaken, reorderProducts as reorderProductsDb } from "@/lib/bakery/admin/products";
import { slugify } from "@/lib/utils/format";
import type { AdminActionResult } from "./types";

export async function createProduct(input: {
  data: ProductData;
  categoryId: number | null;
  status: "active" | "draft";
  slug?: string;
}): Promise<AdminActionResult> {
  await requireAdmin();
  const data = productDataSchema.parse(input.data);

  let slug = input.slug?.trim() || slugify(data.name.vi);
  if (await isProductSlugTaken(slug)) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const row = await createBakeryRow({
    type: "product",
    data,
    slug,
    parentId: input.categoryId,
    status: input.status,
  });

  updateTag("products");
  return { ok: true, id: row.id };
}

export async function updateProduct(
  id: number,
  input: { data: ProductData; categoryId: number | null; status: "active" | "draft"; slug?: string },
): Promise<AdminActionResult> {
  await requireAdmin();
  const data = productDataSchema.parse(input.data);

  let slug = input.slug?.trim() || slugify(data.name.vi);
  if (await isProductSlugTaken(slug, id)) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  await updateBakeryRow(id, "product", {
    data,
    parentId: input.categoryId,
    status: input.status,
    slug,
  });

  updateTag("products");
  return { ok: true, id };
}

export async function deleteProduct(id: number): Promise<AdminActionResult> {
  await requireAdmin();
  await deleteBakeryRow(id, "product");
  updateTag("products");
  return { ok: true };
}

export async function bulkDeleteProducts(ids: number[]): Promise<AdminActionResult> {
  await requireAdmin();
  await Promise.all(ids.map((id) => deleteBakeryRow(id, "product")));
  updateTag("products");
  return { ok: true };
}

export async function bulkSetProductStatus(ids: number[], status: "active" | "draft" | "archived"): Promise<AdminActionResult> {
  await requireAdmin();
  await Promise.all(ids.map((id) => updateBakeryRow(id, "product", { status })));
  updateTag("products");
  return { ok: true };
}

export async function toggleProductFeatured(id: number, data: ProductData, isFeatured: boolean): Promise<AdminActionResult> {
  await requireAdmin();
  await updateBakeryRow(id, "product", { data: { ...data, is_featured: isFeatured } });
  updateTag("products");
  return { ok: true };
}

export async function reorderProducts(orderedIds: number[]): Promise<AdminActionResult> {
  await requireAdmin();
  await reorderProductsDb(orderedIds);
  updateTag("products");
  return { ok: true };
}
