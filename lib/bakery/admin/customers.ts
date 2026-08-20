import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { orderDataSchema } from "@/lib/bakery/schemas";

export interface AdminCustomerSummary {
  phone: string;
  name: string;
  hasAccount: boolean;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
}

/** Aggregates from every order by phone — mục 9.11 ("gộp từ đơn hàng + type='customer'"). */
export async function listAdminCustomers(): Promise<AdminCustomerSummary[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("bakery").select("created_at, data").eq("type", "order");
  if (error) throw error;

  const byPhone = new Map<string, AdminCustomerSummary>();
  for (const row of data ?? []) {
    const parsed = orderDataSchema.safeParse(row.data);
    if (!parsed.success) continue;
    const { phone, customer_name, total, user_id } = parsed.data;

    const existing = byPhone.get(phone);
    if (!existing) {
      byPhone.set(phone, {
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
      if (row.created_at > existing.lastOrderAt) {
        existing.lastOrderAt = row.created_at;
        existing.name = customer_name;
      }
    }
  }

  return [...byPhone.values()].sort((a, b) => b.totalSpent - a.totalSpent);
}
