import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
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
