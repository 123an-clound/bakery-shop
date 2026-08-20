import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { customCakeDataSchema, type CustomCakeData } from "@/lib/bakery/schemas";

export interface AdminCustomCakeRow {
  id: number;
  status: string;
  createdAt: string;
  data: CustomCakeData;
}

export async function listAdminCustomCakes(): Promise<AdminCustomCakeRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bakery")
    .select("id, status, created_at, data")
    .eq("type", "custom_cake")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    status: row.status ?? "new",
    createdAt: row.created_at,
    data: customCakeDataSchema.parse(row.data),
  }));
}

export async function getAdminCustomCake(id: number): Promise<AdminCustomCakeRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bakery")
    .select("id, status, created_at, data")
    .eq("type", "custom_cake")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { id: data.id, status: data.status ?? "new", createdAt: data.created_at, data: customCakeDataSchema.parse(data.data) };
}
