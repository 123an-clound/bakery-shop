import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { bannerDataSchema, type BannerData } from "@/lib/bakery/schemas";

export interface AdminBannerRow {
  id: number;
  status: string;
  sortOrder: number;
  createdAt: string;
  data: BannerData;
}

export async function listAdminBanners(): Promise<AdminBannerRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bakery")
    .select("id, status, sort_order, created_at, data")
    .eq("type", "banner")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    status: row.status ?? "active",
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    data: bannerDataSchema.parse(row.data),
  }));
}

export async function getAdminBanner(id: number): Promise<AdminBannerRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bakery")
    .select("id, status, sort_order, created_at, data")
    .eq("type", "banner")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data
    ? { id: data.id, status: data.status ?? "active", sortOrder: data.sort_order, createdAt: data.created_at, data: bannerDataSchema.parse(data.data) }
    : null;
}

export async function reorderBanners(orderedIds: number[]): Promise<void> {
  const supabase = createAdminClient();
  await Promise.all(
    orderedIds.map((id, index) => supabase.from("bakery").update({ sort_order: index }).eq("id", id).eq("type", "banner")),
  );
}
