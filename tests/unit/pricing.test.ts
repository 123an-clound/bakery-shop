import { describe, expect, it } from "vitest";

import { calcOrderTotal, calcShippingFee, calcSubtotal, validateCoupon } from "@/lib/bakery/pricing";
import type { CouponData } from "@/lib/bakery/schemas";

function makeCoupon(overrides: Partial<CouponData> = {}): CouponData {
  return {
    code: "SINHNHAT10",
    discount_type: "percent",
    value: 10,
    min_order: 0,
    used_count: 0,
    ...overrides,
  };
}

describe("calcSubtotal", () => {
  it("sums unitPrice * qty", () => {
    expect(calcSubtotal([{ unitPrice: 100000, qty: 2 }, { unitPrice: 50000, qty: 1 }])).toBe(250000);
  });
});

describe("validateCoupon", () => {
  it("accepts a valid percent coupon and computes the discount", () => {
    const coupon = makeCoupon({ discount_type: "percent", value: 10, min_order: 300000 });
    const result = validateCoupon(coupon, 500000);
    expect(result).toEqual({ valid: true, discount: 50000 });
  });

  it("caps percent discount at max_discount", () => {
    const coupon = makeCoupon({ discount_type: "percent", value: 50, max_discount: 100000 });
    const result = validateCoupon(coupon, 1000000);
    expect(result).toEqual({ valid: true, discount: 100000 });
  });

  it("rejects when subtotal is below min_order", () => {
    const coupon = makeCoupon({ min_order: 300000 });
    const result = validateCoupon(coupon, 200000);
    expect(result).toEqual({ valid: false, reason: "min_order_not_met" });
  });

  it("rejects when usage_limit is reached", () => {
    const coupon = makeCoupon({ usage_limit: 5, used_count: 5 });
    const result = validateCoupon(coupon, 500000);
    expect(result).toEqual({ valid: false, reason: "usage_limit_reached" });
  });

  it("rejects an expired coupon", () => {
    const coupon = makeCoupon({ ends_at: "2020-01-01T00:00:00Z" });
    const result = validateCoupon(coupon, 500000, new Date("2026-01-01T00:00:00Z"));
    expect(result).toEqual({ valid: false, reason: "expired" });
  });

  it("rejects a coupon that hasn't started yet", () => {
    const coupon = makeCoupon({ starts_at: "2030-01-01T00:00:00Z" });
    const result = validateCoupon(coupon, 500000, new Date("2026-01-01T00:00:00Z"));
    expect(result).toEqual({ valid: false, reason: "not_started" });
  });

  it("never discounts more than the subtotal (fixed coupon larger than order)", () => {
    const coupon = makeCoupon({ discount_type: "fixed", value: 1000000 });
    const result = validateCoupon(coupon, 100000);
    expect(result).toEqual({ valid: true, discount: 100000 });
  });
});

describe("calcShippingFee", () => {
  it("charges the fee below the free-shipping threshold", () => {
    expect(calcShippingFee(400000, { fee: 25000, freeFrom: 500000 })).toBe(25000);
  });

  it("waives the fee at or above the threshold", () => {
    expect(calcShippingFee(500000, { fee: 25000, freeFrom: 500000 })).toBe(0);
    expect(calcShippingFee(600000, { fee: 25000, freeFrom: 500000 })).toBe(0);
  });
});

describe("calcOrderTotal", () => {
  it("combines subtotal, discount, and shipping correctly", () => {
    const result = calcOrderTotal({
      items: [{ unitPrice: 300000, qty: 1 }],
      discount: 30000,
      shipping: { fee: 25000, freeFrom: 500000 },
    });
    expect(result).toEqual({ subtotal: 300000, discount: 30000, shippingFee: 25000, total: 295000 });
  });

  it("shipping is based on the post-discount amount, not the raw subtotal", () => {
    // Subtotal 520k is above the 500k free-shipping threshold, but a 30k
    // discount brings the payable amount to 490k — shipping should apply.
    const result = calcOrderTotal({
      items: [{ unitPrice: 520000, qty: 1 }],
      discount: 30000,
      shipping: { fee: 25000, freeFrom: 500000 },
    });
    expect(result.shippingFee).toBe(25000);

    // A smaller discount that keeps the payable amount at/above the
    // threshold still waives shipping.
    const stillFree = calcOrderTotal({
      items: [{ unitPrice: 520000, qty: 1 }],
      discount: 10000,
      shipping: { fee: 25000, freeFrom: 500000 },
    });
    expect(stillFree.shippingFee).toBe(0);
  });

  it("never lets discount exceed subtotal", () => {
    const result = calcOrderTotal({
      items: [{ unitPrice: 100000, qty: 1 }],
      discount: 999999,
      shipping: { fee: 25000, freeFrom: 500000 },
    });
    expect(result.discount).toBe(100000);
    expect(result.total).toBe(25000);
  });
});
