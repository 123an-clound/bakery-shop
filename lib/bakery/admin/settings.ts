import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { settingPrivateDataSchema, type SettingPrivateData } from "@/lib/bakery/schemas";

export async function getAdminPrivateSettings(): Promise<{ id: number; data: SettingPrivateData } | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("bakery").select("id, data").eq("type", "setting").eq("slug", "private").maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, data: settingPrivateDataSchema.parse(data.data) } : null;
}
