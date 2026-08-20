import "server-only";

import { createClient } from "@/lib/supabase/server";

import { settingSiteDataSchema, themeDataSchema } from "./schemas";
import type { BakeryRow, BakeryType } from "./types";

export interface ListOptions {
  status?: string;
  parentId?: number | null;
  limit?: number;
  offset?: number;
  orderBy?: "sort_order" | "created_at";
  ascending?: boolean;
}

/** Generic read: rows of one `type`, respecting RLS (public/own-row policies only). */
export async function listByType(type: BakeryType, opts: ListOptions = {}): Promise<BakeryRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("bakery")
    .select("*")
    .eq("type", type)
    .eq("status", opts.status ?? "active");

  if (opts.parentId !== undefined) {
    query = opts.parentId === null ? query.is("parent_id", null) : query.eq("parent_id", opts.parentId);
  }

  query = query.order(opts.orderBy ?? "sort_order", { ascending: opts.ascending ?? true });

  if (opts.limit !== undefined) {
    const from = opts.offset ?? 0;
    query = query.range(from, from + opts.limit - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as BakeryRow[];
}

export async function getBySlug(type: BakeryType, slug: string): Promise<BakeryRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bakery")
    .select("*")
    .eq("type", type)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as BakeryRow | null;
}

export async function getById(id: number): Promise<BakeryRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("bakery").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as BakeryRow | null;
}

/** `setting` row with slug `site` — public shop info, parsed against its Zod schema. */
export async function getSiteSettings() {
  const row = await getBySlug("setting", "site");
  if (!row) return null;
  return { ...row, data: settingSiteDataSchema.parse(row.data) };
}

/** `theme` row with slug `default` — drives colors/fonts/home sections. */
export async function getTheme() {
  const row = await getBySlug("theme", "default");
  if (!row) return null;
  return { ...row, data: themeDataSchema.parse(row.data) };
}
