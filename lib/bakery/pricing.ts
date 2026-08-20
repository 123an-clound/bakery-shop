import type { CouponData } from "./schemas";

export interface CartLine {
  unitPrice: number;
  qty: number;
}

export function calcSubtotal(items: CartLine[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
}

export type CouponValidationResult =
  | { valid: true; discount: number }
  | { valid: false; reason: "expired" | "not_started" | "usage_limit_reached" | "min_order_not_met" | "disabled" };

/** Validates a coupon against the current subtotal — muc 13 "validateCoupon". */
export function validateCoupon(
  coupon: CouponData,
  subtotal: number,
  now: Date = new Date(),
): CouponValidationResult {
  if (coupon.starts_at && now < new Date(coupon.starts_at)) {
    return { valid: false, reason: "not_started" };
  }
  if (coupon.ends_at && now > new Date(coupon.ends_at)) {
    return { valid: false, reason: "expired" };
  }
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) {
    return { valid: false, reason: "usage_limit_reached" };
  }
  if (subtotal < coupon.min_order) {
    return { valid: false, reason: "min_order_not_met" };
  }

  const rawDiscount = coupon.discount_type === "percent" ? subtotal * (coupon.value / 100) : coupon.value;
  const discount = Math.min(rawDiscount, coupon.max_discount ?? rawDiscount, subtotal);
  return { valid: true, discount: Math.round(discount) };
}

export interface ShippingConfig {
  fee: number;
  freeFrom: number;
}

/** muc 8.5: mien phi ship tu mot muc gia. */
export function calcShippingFee(subtotal: number, shipping: ShippingConfig): number {
  return subtotal >= shipping.freeFrom ? 0 : shipping.fee;
}

/** muc 13 "calcOrderTotal" — tong hop toan bo cong thuc tinh gia don hang. */
export function calcOrderTotal({
  items,
  discount = 0,
  shipping,
}: {
  items: CartLine[];
  discount?: number;
  shipping: ShippingConfig;
}): { subtotal: number; discount: number; shippingFee: number; total: number } {
  const subtotal = calcSubtotal(items);
  const cappedDiscount = Math.min(discount, subtotal);
  const shippingFee = calcShippingFee(subtotal - cappedDiscount, shipping);
  const total = subtotal - cappedDiscount + shippingFee;
  return { subtotal, discount: cappedDiscount, shippingFee, total };
}
