"use server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createBakeryRow, updateBakeryRow, deleteBakeryRow } from "@/lib/bakery/mutations";
import { couponDataSchema, type CouponData } from "@/lib/bakery/schemas";
import { isCouponCodeTaken } from "@/lib/bakery/admin/coupons";
import type { AdminActionResult } from "./types";

// No updateTag() calls here — getActiveCouponByCode() (lib/bakery/catalog.ts)
// reads live on every checkout, uncached, so admin edits apply immediately.

export async function createCoupon(input: { data: CouponData; status: "active" | "expired" | "disabled" }): Promise<AdminActionResult> {
  await requireAdmin();
  const data = couponDataSchema.parse(input.data);
  const code = data.code.toUpperCase();

  if (await isCouponCodeTaken(code)) {
    return { ok: false, error: "code_taken" };
  }

  const row = await createBakeryRow({ type: "coupon", data: { ...data, code }, slug: code, status: input.status });
  return { ok: true, id: row.id };
}

export async function updateCoupon(
  id: number,
  input: { data: CouponData; status: "active" | "expired" | "disabled" },
): Promise<AdminActionResult> {
  await requireAdmin();
  const data = couponDataSchema.parse(input.data);
  const code = data.code.toUpperCase();

  if (await isCouponCodeTaken(code, id)) {
    return { ok: false, error: "code_taken" };
  }

  await updateBakeryRow(id, "coupon", { data: { ...data, code }, slug: code, status: input.status });
  return { ok: true, id };
}

export async function deleteCoupon(id: number): Promise<AdminActionResult> {
  await requireAdmin();
  await deleteBakeryRow(id, "coupon");
  return { ok: true };
}
