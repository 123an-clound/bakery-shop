import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { categoryDataSchema, type CategoryData } from "@/lib/bakery/schemas";
import type { BakeryRow } from "@/lib/bakery/types";

export interface AdminCategoryRow {
  id: number;
  slug: string | null;
  status: string;
  sortOrder: number;
  createdAt: string;
  data: CategoryData;
  productCount: number;
}

function toAdminCategory(
  row: Pick<BakeryRow, "id" | "slug" | "status" | "sort_order" | "created_at" | "data">,
  productCount: number,
): AdminCategoryRow {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    data: categoryDataSchema.parse(row.data),
    productCount,
  };
}

export async function listAdminCategories(): Promise<AdminCategoryRow[]> {
  const supabase = createAdminClient();
  const [{ data, error }, productsRes] = await Promise.all([
    supabase
      .from("bakery")
      .select("id, slug, status, sort_order, created_at, data")
      .eq("type", "category")
      .order("sort_order", { ascending: true }),
    supabase.from("bakery").select("parent_id").eq("type", "product"),
  ]);
  if (error) throw error;
  if (productsRes.error) throw productsRes.error;

  const counts = new Map<number, number>();
  for (const p of productsRes.data ?? []) {
    if (p.parent_id === null) continue;
    counts.set(p.parent_id, (counts.get(p.parent_id) ?? 0) + 1);
  }

  return (data ?? []).map((row) => toAdminCategory(row, counts.get(row.id) ?? 0));
}

export async function getAdminCategory(id: number): Promise<AdminCategoryRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bakery")
    .select("id, slug, status, sort_order, created_at, data")
    .eq("type", "category")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toAdminCategory(data, 0) : null;
}

export async function isCategorySlugTaken(slug: string, excludeId?: number): Promise<boolean> {
  const supabase = createAdminClient();
  let query = supabase.from("bakery").select("id").eq("type", "category").eq("slug", slug);
  if (excludeId !== undefined) query = query.neq("id", excludeId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data !== null;
}

export async function reorderCategories(orderedIds: number[]): Promise<void> {
  const supabase = createAdminClient();
  await Promise.all(
    orderedIds.map((id, index) => supabase.from("bakery").update({ sort_order: index }).eq("id", id).eq("type", "category")),
  );
}
