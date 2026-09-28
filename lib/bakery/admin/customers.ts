import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { customerDataSchema, orderDataSchema } from "@/lib/bakery/schemas";

export interface AdminCustomerSummary {
  key: string;
  phone: string | null;
  name: string;
  hasAccount: boolean;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

/** Aggregates from every order by phone, plus registered `type='customer'`
 * profiles that have not ordered yet — mục 9.11 ("gộp từ đơn hàng + type='customer'"). */
export async function listAdminCustomers(): Promise<AdminCustomerSummary[]> {
  const supabase = createAdminClient();
  const [ordersRes, customersRes] = await Promise.all([
    supabase.from("bakery").select("created_at, data").eq("type", "order"),
    supabase.from("bakery").select("data").eq("type", "customer"),
  ]);
  if (ordersRes.error) throw ordersRes.error;
  if (customersRes.error) throw customersRes.error;

  const byPhone = new Map<string, AdminCustomerSummary>();
  const userIdsWithOrders = new Set<string>();
  for (const row of ordersRes.data ?? []) {
    const parsed = orderDataSchema.safeParse(row.data);
    if (!parsed.success) continue;
    const { phone, customer_name, total, user_id } = parsed.data;
    if (user_id) userIdsWithOrders.add(user_id);

    const existing = byPhone.get(phone);
    if (!existing) {
      byPhone.set(phone, {
        key: phone,
        phone,
        name: customer_name,
        hasAccount: !!user_id,
        orderCount: 1,
        totalSpent: total,
        lastOrderAt: row.created_at,
      });
    } else {
      existing.orderCount += 1;
      existing.totalSpent += total;
      existing.hasAccount = existing.hasAccount || !!user_id;
      if (existing.lastOrderAt === null || row.created_at > existing.lastOrderAt) {
        existing.lastOrderAt = row.created_at;
        existing.name = customer_name;
      }
    }
  }

  const withOrders = [...byPhone.values()].sort((a, b) => b.totalSpent - a.totalSpent);

  const withoutOrders: AdminCustomerSummary[] = [];
  for (const row of customersRes.data ?? []) {
    const parsed = customerDataSchema.safeParse(row.data);
    if (!parsed.success || userIdsWithOrders.has(parsed.data.user_id)) continue;
    withoutOrders.push({
      key: parsed.data.user_id,
      phone: parsed.data.phone ?? null,
      name: parsed.data.full_name || "—",
      hasAccount: true,
      orderCount: 0,
      totalSpent: 0,
      lastOrderAt: null,
    });
  }

  return [...withOrders, ...withoutOrders];
}
