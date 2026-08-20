"use server";

import { z } from "zod";

import { getActiveCouponByCode } from "@/lib/bakery/catalog";
import { validateCoupon } from "@/lib/bakery/pricing";

const inputSchema = z.object({
  code: z.string().trim().min(1).max(40),
  subtotal: z.number().nonnegative(),
});

export type ApplyCouponResult =
  | { ok: true; code: string; discount: number }
  | { ok: false; message: string };

/**
 * Coupon usage is validated here for UX feedback, but `used_count` is only
 * ever incremented server-side inside POST /api/orders at the moment an
 * order is actually created — never trust the client to have "used" a
 * coupon just because this action approved it (muc 6.3 checklist).
 */
export async function applyCoupon(code: string, subtotal: number): Promise<ApplyCouponResult> {
  const parsed = inputSchema.safeParse({ code, subtotal });
  if (!parsed.success) {
    return { ok: false, message: "Ma giam gia khong hop le." };
  }

  const coupon = await getActiveCouponByCode(parsed.data.code);
  if (!coupon) {
    return { ok: false, message: "Ma giam gia khong ton tai hoac da bi vo hieu hoa." };
  }

  const result = validateCoupon(coupon.data, parsed.data.subtotal);
  if (!result.valid) {
    const messages: Record<typeof result.reason, string> = {
      expired: "Ma giam gia da het han.",
      not_started: "Ma giam gia chua co hieu luc.",
      usage_limit_reached: "Ma giam gia da het luot su dung.",
      min_order_not_met: "Don hang chua dat gia tri toi thieu de ap dung ma nay.",
      disabled: "Ma giam gia khong con hoat dong.",
    };
    return { ok: false, message: messages[result.reason] };
  }

  return { ok: true, code: coupon.data.code, discount: result.discount };
}
