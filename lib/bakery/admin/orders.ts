import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { orderDataSchema, type OrderData } from "@/lib/bakery/schemas";

export interface AdminOrderRow {
  id: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  data: OrderData;
}

export interface AdminOrderFilters {
  status?: string;
  paymentMethod?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function listAdminOrders(filters: AdminOrderFilters = {}): Promise<AdminOrderRow[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("bakery")
    .select("id, status, created_at, updated_at, data")
    .eq("type", "order")
    .order("created_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("created_at", filters.dateTo);

  const { data, error } = await query;
  if (error) throw error;

  let rows = (data ?? []).map((row) => ({
    id: row.id,
    status: row.status ?? "pending",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    data: orderDataSchema.parse(row.data),
  }));

  if (filters.paymentMethod) {
    rows = rows.filter((r) => r.data.payment_method === filters.paymentMethod);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.data.code.toLowerCase().includes(q) ||
        r.data.phone.includes(q) ||
        r.data.customer_name.toLowerCase().includes(q),
    );
  }

  return rows;
}

export async function getAdminOrder(id: number): Promise<AdminOrderRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bakery")
    .select("id, status, created_at, updated_at, data")
    .eq("type", "order")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    status: data.status ?? "pending",
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    data: orderDataSchema.parse(data.data),
  };
}

export async function ordersToCsv(rows: AdminOrderRow[]): Promise<string> {
  const header = ["Mã đơn", "Khách hàng", "SĐT", "Trạng thái", "Thanh toán", "Tổng tiền", "Ngày tạo"];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = [header.map(escape).join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.data.code,
        row.data.customer_name,
        row.data.phone,
        row.status,
        row.data.payment_method,
        String(row.data.total),
        new Date(row.createdAt).toLocaleString("vi-VN"),
      ]
        .map(escape)
        .join(","),
    );
  }
  return lines.join("\n");
}
