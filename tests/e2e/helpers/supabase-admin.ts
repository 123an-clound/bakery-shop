import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for e2e test cleanup only (deleting rows the test
 * itself created against the real Supabase project — there is no separate
 * test database, matching how every prior phase's manual verification
 * worked). Never used to assert app behavior, only to tidy up afterward.
 */
export function createTestAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing — is .env.local loaded?");
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function deleteBakeryRowsByType(type: string, ids: number[]) {
  if (ids.length === 0) return;
  const supabase = createTestAdminClient();
  await supabase.from("bakery").delete().eq("type", type).in("id", ids);
}

/** Cleans up e2e-created orders/order_items by the test phone number, since the
 * success page never exposes the row id to key off of. */
export async function deleteTestOrdersByPhone(phone: string) {
  const supabase = createTestAdminClient();
  const { data: orders } = await supabase.from("bakery").select("id").eq("type", "order").eq("data->>phone", phone);
  const ids = (orders ?? []).map((o) => o.id);
  if (ids.length === 0) return;
  await supabase.from("bakery").delete().eq("type", "order_item").in("parent_id", ids);
  await supabase.from("bakery").delete().eq("type", "order").in("id", ids);
}
