import { describe, expect, it } from "vitest";

import {
  assertAllBakeryTypesHaveSchema,
  bakeryDataSchemas,
  categoryDataSchema,
  couponDataSchema,
  orderDataSchema,
  productDataSchema,
  settingSiteDataSchema,
  themeDataSchema,
} from "@/lib/bakery/schemas";
import { BAKERY_TYPES } from "@/lib/bakery/types";

describe("bakeryDataSchemas dispatch table", () => {
  it("covers every BakeryType", () => {
    expect(() => assertAllBakeryTypesHaveSchema()).not.toThrow();
    expect(Object.keys(bakeryDataSchemas).sort()).toEqual([...BAKERY_TYPES].sort());
  });
});

describe("productDataSchema", () => {
  it("accepts a valid product payload from KE-HOACH-DU-AN.md muc 4.5", () => {
    const result = productDataSchema.safeParse({
      name: { vi: "Bánh kem dâu tây", en: "Strawberry Cake" },
      price: 350000,
      sale_price: 299000,
      images: ["https://example.com/1.webp"],
      is_featured: true,
      options: [
        {
          key: "size",
          label: { vi: "Kích thước" },
          choices: [
            { value: "16cm", label: { vi: "16cm" }, price_delta: 0 },
            { value: "20cm", label: { vi: "20cm" }, price_delta: 120000 },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a product missing the mandatory Vietnamese name", () => {
    const result = productDataSchema.safeParse({ price: 100000 });
    expect(result.success).toBe(false);
  });

  it("rejects a negative price", () => {
    const result = productDataSchema.safeParse({
      name: { vi: "Bánh test" },
      price: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe("categoryDataSchema", () => {
  it("accepts a minimal category", () => {
    const result = categoryDataSchema.safeParse({ name: { vi: "Bánh kem sinh nhật" } });
    expect(result.success).toBe(true);
  });
});

describe("settingSiteDataSchema", () => {
  it("accepts the sample site settings shape", () => {
    const result = settingSiteDataSchema.safeParse({
      brand_name: { vi: "Tiệm Bánh Ngọt Ngào", en: "Sweet Bakery" },
      hotline: "0900000000",
      shipping: { fee: 25000, free_from: 500000 },
    });
    expect(result.success).toBe(true);
  });
});

describe("themeDataSchema", () => {
  it("accepts the full default theme payload", () => {
    const result = themeDataSchema.safeParse({
      colors: {
        primary: "#F7A8C4",
        secondary: "#FFE7C7",
        accent: "#7B4B2A",
        background: "#FFFBF7",
        foreground: "#3A2A22",
        muted: "#F3E9E1",
        success: "#8BC79A",
        destructive: "#E76A6A",
      },
      radius: "1.5rem",
      fonts: { heading: "Baloo 2", body: "Be Vietnam Pro" },
      hero: { variant: "pastel-3d", title: { vi: "Đặt bánh ngay" } },
      sections: [{ key: "hero", enabled: true, order: 1 }],
      effects: {
        smooth_scroll: true,
        confetti_on_add_to_cart: true,
        parallax: true,
        reduced_motion_respect: true,
      },
      announcement_bar: { enabled: true, text: { vi: "Freeship don tu 500k" } },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown section key", () => {
    const result = themeDataSchema.safeParse({
      colors: {
        primary: "#000",
        secondary: "#000",
        accent: "#000",
        background: "#000",
        foreground: "#000",
        muted: "#000",
        success: "#000",
        destructive: "#000",
      },
      radius: "1rem",
      fonts: { heading: "A", body: "B" },
      hero: { variant: "pastel-3d", title: { vi: "x" } },
      sections: [{ key: "not_a_real_section", enabled: true, order: 1 }],
      effects: {
        smooth_scroll: true,
        confetti_on_add_to_cart: true,
        parallax: true,
        reduced_motion_respect: true,
      },
      announcement_bar: { enabled: false, text: { vi: "x" } },
    });
    expect(result.success).toBe(false);
  });
});

describe("orderDataSchema", () => {
  const validOrder = {
    code: "BK260820-4821",
    customer_name: "Nguyễn Văn A",
    phone: "0912345678",
    address: { line: "12 Le Loi", city: "TP.HCM" },
    delivery_at: "2026-08-22T15:00:00+07:00",
    payment_method: "cod",
    subtotal: 470000,
    total: 470000,
    items_snapshot: [
      {
        product_id: 12,
        name: "Bánh kem dâu tây",
        unit_price: 470000,
        qty: 1,
        line_total: 470000,
      },
    ],
  };

  it("accepts a valid COD order", () => {
    expect(orderDataSchema.safeParse(validOrder).success).toBe(true);
  });

  it("rejects an invalid Vietnamese phone number", () => {
    const result = orderDataSchema.safeParse({ ...validOrder, phone: "12345" });
    expect(result.success).toBe(false);
  });

  it("rejects an order with no items", () => {
    const result = orderDataSchema.safeParse({ ...validOrder, items_snapshot: [] });
    expect(result.success).toBe(false);
  });
});

describe("couponDataSchema", () => {
  it("accepts a percent-off coupon", () => {
    const result = couponDataSchema.safeParse({
      code: "SINHNHAT10",
      discount_type: "percent",
      value: 10,
      max_discount: 100000,
      min_order: 300000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a zero-value coupon", () => {
    const result = couponDataSchema.safeParse({
      code: "ZERO",
      discount_type: "fixed",
      value: 0,
    });
    expect(result.success).toBe(false);
  });
});
