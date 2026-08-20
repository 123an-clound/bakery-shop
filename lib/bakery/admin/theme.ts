import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { themeDataSchema, settingSiteDataSchema, type ThemeData, type SettingSiteData } from "@/lib/bakery/schemas";

export async function getAdminTheme(): Promise<{ id: number; data: ThemeData } | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("bakery").select("id, data").eq("type", "theme").eq("slug", "default").maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, data: themeDataSchema.parse(data.data) } : null;
}

export async function getAdminSiteSettings(): Promise<{ id: number; data: SettingSiteData } | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("bakery").select("id, data").eq("type", "setting").eq("slug", "site").maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, data: settingSiteDataSchema.parse(data.data) } : null;
}
