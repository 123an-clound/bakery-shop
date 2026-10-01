import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { orderDataSchema } from "./schemas";
import { cookies } from "next/headers";
import { orderAccessCookie, verifyOrderAccess } from "@/lib/auth/order-access";

// RLS denies direct order reads: a JSONB row also contains admin-only fields.
// Every public read below authenticates its caller or verifies a receipt token.
const customerOrderSchema = orderDataSchema.omit({ internal_note: true, request_hash: true, reserved_product_ids: true });

/** Internal lookup. Public callers must verify ownership, receipt token or phone. */
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
  return { ...data, data: customerOrderSchema.parse(data.data) };
}

export async function getOrderByCodeAndPhone(code: string, last4Phone: string) {
  const order = await getOrderByCode(code);
  if (!order) return null;
  if (!order.data.phone.endsWith(last4Phone)) return null;
  return order;
}

/** Receipt access requires the checkout cookie or an authenticated owner. */
export async function getOrderForReceipt(code: string) {
  if (!/^BK\d{6}-\d{4}$/.test(code)) return null;
  const token = (await cookies()).get(orderAccessCookie(code))?.value;
  if (verifyOrderAccess(code, token)) return getOrderByCode(code);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await createAdminClient().from("bakery").select("*").eq("type", "order")
    .eq("data->>code", code).eq("data->>user_id", user.id).maybeSingle();
  if (error) throw error;
  return data ? { ...data, data: customerOrderSchema.parse(data.data) } : null;
}

/**
 * Identity comes from Supabase getUser(), never a caller-provided user ID.
 * Apply ownership in the query before reading with the privileged client.
 * RLS prevents bypassing this projection through the public Data API.
 */
export async function getMyOrders() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await createAdminClient()
    .from("bakery")
    .select("*")
    .eq("type", "order")
    .eq("data->>user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, data: customerOrderSchema.parse(row.data) }));
}
