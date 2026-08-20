"use server";

import { updateTag } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { updateBakeryRow } from "@/lib/bakery/mutations";
import { recomputeProductRating } from "@/lib/bakery/admin/reviews";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminActionResult } from "./types";

export async function approveReview(id: number, productId: number | null): Promise<AdminActionResult> {
  await requireAdmin();
  await updateBakeryRow(id, "review", { status: "approved" });
  if (productId !== null) {
    await recomputeProductRating(productId);
    updateTag("products");
  }
  updateTag("reviews");
  return { ok: true, id };
}

export async function rejectReview(id: number, productId: number | null): Promise<AdminActionResult> {
  await requireAdmin();
  const supabase = createAdminClient();
  // Fetch current status first — recompute only matters if it *was* approved.
  const { data: current } = await supabase.from("bakery").select("status").eq("type", "review").eq("id", id).maybeSingle();
  const wasApproved = current?.status === "approved";

  await updateBakeryRow(id, "review", { status: "rejected" });
  if (wasApproved && productId !== null) {
    await recomputeProductRating(productId);
    updateTag("products");
  }
  updateTag("reviews");
  return { ok: true, id };
}
