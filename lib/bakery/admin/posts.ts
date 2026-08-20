import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { postDataSchema, type PostData } from "@/lib/bakery/schemas";

export interface AdminPostRow {
  id: number;
  slug: string | null;
  status: string;
  createdAt: string;
  data: PostData;
}

export async function listAdminPosts(): Promise<AdminPostRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bakery")
    .select("id, slug, status, created_at, data")
    .eq("type", "post")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    status: row.status ?? "draft",
    createdAt: row.created_at,
    data: postDataSchema.parse(row.data),
  }));
}

export async function getAdminPost(id: number): Promise<AdminPostRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bakery")
    .select("id, slug, status, created_at, data")
    .eq("type", "post")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, slug: data.slug, status: data.status ?? "draft", createdAt: data.created_at, data: postDataSchema.parse(data.data) } : null;
}

export async function isPostSlugTaken(slug: string, excludeId?: number): Promise<boolean> {
  const supabase = createAdminClient();
  let query = supabase.from("bakery").select("id").eq("type", "post").eq("slug", slug);
  if (excludeId !== undefined) query = query.neq("id", excludeId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data !== null;
}
