import { describe, expect, it } from "vitest";

import { cartCount, cartSubtotal, makeLineId, type CartItem } from "@/lib/store/cart";

function makeItem(overrides: Partial<CartItem>): CartItem {
  return {
    lineId: "1::",
    productId: 1,
    slug: "banh-kem-dau-tay-1",
    name: "Bánh kem dâu tây",
    unitPrice: 100000,
    qty: 1,
    options: {},
    ...overrides,
  };
}

describe("makeLineId", () => {
  it("is stable regardless of option key order", () => {
    const a = makeLineId(1, { size: "20cm", flavor: "dau" });
    const b = makeLineId(1, { flavor: "dau", size: "20cm" });
    expect(a).toBe(b);
  });

  it("differs for different option values", () => {
    const a = makeLineId(1, { size: "16cm" });
    const b = makeLineId(1, { size: "20cm" });
    expect(a).not.toBe(b);
  });

  it("differs for different products with the same options", () => {
    expect(makeLineId(1, { size: "16cm" })).not.toBe(makeLineId(2, { size: "16cm" }));
  });
});

describe("cartSubtotal", () => {
  it("sums unitPrice * qty across lines", () => {
    const items = [makeItem({ unitPrice: 100000, qty: 2 }), makeItem({ unitPrice: 50000, qty: 3 })];
    expect(cartSubtotal(items)).toBe(350000);
  });

  it("returns 0 for an empty cart", () => {
    expect(cartSubtotal([])).toBe(0);
  });
});

describe("cartCount", () => {
  it("sums quantities across lines", () => {
    const items = [makeItem({ qty: 2 }), makeItem({ qty: 3 })];
    expect(cartCount(items)).toBe(5);
  });
});
