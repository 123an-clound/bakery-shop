import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { couponDataSchema, type CouponData } from "@/lib/bakery/schemas";

export interface AdminCouponRow {
  id: number;
  slug: string | null;
  status: string;
  createdAt: string;
  data: CouponData;
}

export async function listAdminCoupons(): Promise<AdminCouponRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bakery")
    .select("id, slug, status, created_at, data")
    .eq("type", "coupon")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    status: row.status ?? "active",
    createdAt: row.created_at,
    data: couponDataSchema.parse(row.data),
  }));
}

export async function isCouponCodeTaken(code: string, excludeId?: number): Promise<boolean> {
  const supabase = createAdminClient();
  let query = supabase.from("bakery").select("id").eq("type", "coupon").eq("slug", code.toUpperCase());
  if (excludeId !== undefined) query = query.neq("id", excludeId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data !== null;
}
