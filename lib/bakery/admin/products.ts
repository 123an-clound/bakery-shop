import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { productDataSchema, type ProductData } from "@/lib/bakery/schemas";
import type { BakeryRow } from "@/lib/bakery/types";

export interface AdminProductRow {
  id: number;
  slug: string | null;
  status: string;
  sortOrder: number;
  categoryId: number | null;
  createdAt: string;
  data: ProductData;
}

function toAdminProduct(row: Pick<BakeryRow, "id" | "slug" | "status" | "sort_order" | "parent_id" | "created_at" | "data">): AdminProductRow {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    sortOrder: row.sort_order,
    categoryId: row.parent_id,
    createdAt: row.created_at,
    data: productDataSchema.parse(row.data),
  };
}

export async function listAdminProducts(): Promise<AdminProductRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bakery")
    .select("id, slug, status, sort_order, parent_id, created_at, data")
    .eq("type", "product")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toAdminProduct);
}

export async function getAdminProduct(id: number): Promise<AdminProductRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bakery")
    .select("id, slug, status, sort_order, parent_id, created_at, data")
    .eq("type", "product")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toAdminProduct(data) : null;
}

export async function isProductSlugTaken(slug: string, excludeId?: number): Promise<boolean> {
  const supabase = createAdminClient();
  let query = supabase.from("bakery").select("id").eq("type", "product").eq("slug", slug);
  if (excludeId !== undefined) query = query.neq("id", excludeId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data !== null;
}

export async function reorderProducts(orderedIds: number[]): Promise<void> {
  const supabase = createAdminClient();
  await Promise.all(
    orderedIds.map((id, index) => supabase.from("bakery").update({ sort_order: index }).eq("id", id).eq("type", "product")),
  );
}
