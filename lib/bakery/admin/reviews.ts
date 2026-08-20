import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { reviewDataSchema, type ReviewData } from "@/lib/bakery/schemas";

export interface AdminReviewRow {
  id: number;
  status: string;
  productId: number | null;
  createdAt: string;
  data: ReviewData;
}

export async function listAdminReviews(): Promise<AdminReviewRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bakery")
    .select("id, status, parent_id, created_at, data")
    .eq("type", "review")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    status: row.status ?? "pending",
    productId: row.parent_id,
    createdAt: row.created_at,
    data: reviewDataSchema.parse(row.data),
  }));
}

/** Recomputes `product.rating_avg`/`rating_count` from every *approved* review — mục 9.9. */
export async function recomputeProductRating(productId: number): Promise<void> {
  const supabase = createAdminClient();
  const [{ data: reviews, error: reviewsError }, { data: product, error: productError }] = await Promise.all([
    supabase.from("bakery").select("data").eq("type", "review").eq("parent_id", productId).eq("status", "approved"),
    supabase.from("bakery").select("data").eq("type", "product").eq("id", productId).maybeSingle(),
  ]);
  if (reviewsError) throw reviewsError;
  if (productError) throw productError;
  if (!product) return;

  const ratings = (reviews ?? [])
    .map((r) => reviewDataSchema.safeParse(r.data))
    .filter((r) => r.success)
    .map((r) => r.data.rating);
  const ratingCount = ratings.length;
  const ratingAvg = ratingCount > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratingCount : 0;

  const productData = product.data as Record<string, unknown>;
  await supabase
    .from("bakery")
    .update({ data: { ...productData, rating_avg: Math.round(ratingAvg * 10) / 10, rating_count: ratingCount } })
    .eq("type", "product")
    .eq("id", productId);
}
