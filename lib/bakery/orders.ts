import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { orderDataSchema } from "./schemas";

/**
 * Orders aren't public content — RLS only lets a signed-in user read their
 * *own* order (`data->>'user_id' = auth.uid()`), which doesn't help a guest
 * checkout (`user_id` is null, and `NULL = NULL` is not true in Postgres).
 * Reads here go through the service-role client instead, matching the
 * plan's own design: the post-checkout success page trusts the freshly
 * generated order code with no extra check (mục 8.7), while
 * /tra-cuu-don-hang additionally requires the last 4 phone digits to guard
 * against code guessing (mục 6.3 IDOR checklist item) — enforced in
 * getOrderByCodeAndPhone below.
 */
export async function getOrderByCode(code: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bakery")
    .select("*")
    .eq("type", "order")
    .eq("data->>code", code)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { ...data, data: orderDataSchema.parse(data.data) };
}

export async function getOrderByCodeAndPhone(code: string, last4Phone: string) {
  const order = await getOrderByCode(code);
  if (!order) return null;
  if (!order.data.phone.endsWith(last4Phone)) return null;
  return order;
}

/**
 * Signed-in user's own order history — goes through the cookie-aware
 * (anon-key) client so RLS's "own rows" policy (`data->>'user_id' =
 * auth.uid()`) is what enforces the boundary, not application code. This is
 * the Phase 5 DoD: user A must never see user B's orders, verified by RLS
 * itself rather than a manual filter that could be gotten wrong.
 */
export async function getMyOrders() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("bakery")
    .select("*")
    .eq("type", "order")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, data: orderDataSchema.parse(row.data) }));
}
