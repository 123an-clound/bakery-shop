"use server";

import { updateTag } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createBakeryRow, updateBakeryRow, deleteBakeryRow } from "@/lib/bakery/mutations";
import { postDataSchema, pageDataSchema, type PostData, type PageData } from "@/lib/bakery/schemas";
import { isPostSlugTaken } from "@/lib/bakery/admin/posts";
import { getAdminPageBySlug } from "@/lib/bakery/admin/pages";
import { slugify } from "@/lib/utils/format";
import type { AdminActionResult } from "./types";

export async function createPost(input: { data: PostData; status: "active" | "draft"; slug?: string }): Promise<AdminActionResult> {
  await requireAdmin();
  const data = postDataSchema.parse(input.data);

  let slug = input.slug?.trim() || slugify(data.title.vi);
  if (await isPostSlugTaken(slug)) slug = `${slug}-${Date.now().toString(36)}`;

  const row = await createBakeryRow({ type: "post", data, slug, status: input.status });
  updateTag("posts");
  return { ok: true, id: row.id };
}

export async function updatePost(id: number, input: { data: PostData; status: "active" | "draft"; slug?: string }): Promise<AdminActionResult> {
  await requireAdmin();
  const data = postDataSchema.parse(input.data);

  let slug = input.slug?.trim() || slugify(data.title.vi);
  if (await isPostSlugTaken(slug, id)) slug = `${slug}-${Date.now().toString(36)}`;

  await updateBakeryRow(id, "post", { data, slug, status: input.status });
  updateTag("posts");
  return { ok: true, id };
}

export async function deletePost(id: number): Promise<AdminActionResult> {
  await requireAdmin();
  await deleteBakeryRow(id, "post");
  updateTag("posts");
  return { ok: true };
}

/** The 4 fixed static pages (mục 9.8) are seeded once — this upserts by slug. */
export async function updateStaticPage(slug: string, data: PageData): Promise<AdminActionResult> {
  await requireAdmin();
  const parsed = pageDataSchema.parse(data);
  const existing = await getAdminPageBySlug(slug);

  if (existing) {
    await updateBakeryRow(existing.id, "page", { data: parsed });
  } else {
    await createBakeryRow({ type: "page", data: parsed, slug, status: "active" });
  }
  updateTag("pages");
  return { ok: true };
}
