import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { orderDataSchema } from "@/lib/bakery/schemas";

export interface RevenueDay {
  day: string;
  revenue: number;
  ordersCount: number;
}

export interface DashboardStats {
  revenueToday: number;
  revenueThisMonth: number;
  pendingOrders: number;
  totalProducts: number;
  pendingReviews: number;
}

export interface OrderStatusCount {
  status: string;
  count: number;
}

export interface RecentOrder {
  id: number;
  code: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

export interface TopProduct {
  productId: number;
  name: string;
  qtySold: number;
  revenue: number;
}

function todayInVietnam(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

/** Reads `v_revenue_daily` — only orders past `pending` count as revenue (mục 9.1). */
export async function getRevenueDaily(days = 30): Promise<RevenueDay[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("v_revenue_daily")
    .select("day, revenue, orders_count")
    .order("day", { ascending: false })
    .limit(days);
  if (error) throw error;
  return (data ?? [])
    .map((row) => ({
      day: row.day as string,
      revenue: Number(row.revenue ?? 0),
      ordersCount: Number(row.orders_count ?? 0),
    }))
    .reverse();
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createAdminClient();
  const today = todayInVietnam();
  const monthPrefix = today.slice(0, 7);

  const [revenueRows, pendingOrdersRes, totalProductsRes, pendingReviewsRes] = await Promise.all([
    supabase.from("v_revenue_daily").select("day, revenue").order("day", { ascending: false }).limit(31),
    supabase.from("bakery").select("id", { count: "exact", head: true }).eq("type", "order").eq("status", "pending"),
    supabase.from("bakery").select("id", { count: "exact", head: true }).eq("type", "product"),
    supabase.from("bakery").select("id", { count: "exact", head: true }).eq("type", "review").eq("status", "pending"),
  ]);

  if (pendingOrdersRes.error) throw pendingOrdersRes.error;
  if (totalProductsRes.error) throw totalProductsRes.error;
  if (pendingReviewsRes.error) throw pendingReviewsRes.error;
  if (revenueRows.error) throw revenueRows.error;

  const revenueToday = revenueRows.data?.find((r) => r.day === today)?.revenue ?? 0;
  const revenueThisMonth = (revenueRows.data ?? [])
    .filter((r) => (r.day as string).startsWith(monthPrefix))
    .reduce((sum, r) => sum + Number(r.revenue ?? 0), 0);

  return {
    revenueToday: Number(revenueToday),
    revenueThisMonth,
    pendingOrders: pendingOrdersRes.count ?? 0,
    totalProducts: totalProductsRes.count ?? 0,
    pendingReviews: pendingReviewsRes.count ?? 0,
  };
}

export async function getOrderStatusBreakdown(): Promise<OrderStatusCount[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("bakery").select("status").eq("type", "order");
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.status ?? "unknown", (counts.get(row.status ?? "unknown") ?? 0) + 1);
  }
  return [...counts.entries()].map(([status, count]) => ({ status, count }));
}

export async function getRecentOrders(limit = 10): Promise<RecentOrder[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bakery")
    .select("id, status, created_at, data")
    .eq("type", "order")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const parsed = orderDataSchema.parse(row.data);
    return {
      id: row.id,
      code: parsed.code,
      customerName: parsed.customer_name,
      total: parsed.total,
      status: row.status ?? "pending",
      createdAt: row.created_at,
    };
  });
}

/** Aggregates `order.items_snapshot` across every order — no DB-side rollup table exists. */
export async function getTopSellingProducts(limit = 5): Promise<TopProduct[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("bakery").select("data").eq("type", "order");
  if (error) throw error;

  const totals = new Map<number, { name: string; qty: number; revenue: number }>();
  for (const row of data ?? []) {
    const parsed = orderDataSchema.safeParse(row.data);
    if (!parsed.success) continue;
    for (const item of parsed.data.items_snapshot) {
      const entry = totals.get(item.product_id) ?? { name: item.name, qty: 0, revenue: 0 };
      entry.qty += item.qty;
      entry.revenue += item.line_total;
      totals.set(item.product_id, entry);
    }
  }

  return [...totals.entries()]
    .map(([productId, v]) => ({ productId, name: v.name, qtySold: v.qty, revenue: v.revenue }))
    .sort((a, b) => b.qtySold - a.qtySold)
    .slice(0, limit);
}
