import { describe, expect, it } from "vitest";

import { filterAndSortProducts, type ProductListItem } from "@/lib/bakery/product-list";
import type { ProductData } from "@/lib/bakery/schemas";

function makeProduct(overrides: Partial<ProductData> & { id: number; createdAt?: string }): ProductListItem {
  const { id, createdAt, ...dataOverrides } = overrides;
  const data: ProductData = {
    name: { vi: `San pham ${id}` },
    price: 100000,
    images: [],
    is_featured: false,
    is_best_seller: false,
    badges: [],
    options: [],
    allergens: [],
    prep_time_hours: 24,
    rating_avg: 0,
    rating_count: 0,
    ...dataOverrides,
  };
  return { id, slug: `san-pham-${id}`, categoryId: 1, createdAt: createdAt ?? "2026-01-01T00:00:00Z", data };
}

describe("filterAndSortProducts", () => {
  it("filters by price range using sale_price when present", () => {
    const items = [
      makeProduct({ id: 1, price: 100000 }),
      makeProduct({ id: 2, price: 300000, sale_price: 150000 }),
      makeProduct({ id: 3, price: 500000 }),
    ];
    const result = filterAndSortProducts(items, { minPrice: 120000, maxPrice: 200000 });
    expect(result.items.map((p) => p.id)).toEqual([2]);
  });

  it("filters by badge", () => {
    const items = [makeProduct({ id: 1, badges: ["new"] }), makeProduct({ id: 2, badges: [] })];
    const result = filterAndSortProducts(items, { badge: "new" });
    expect(result.items.map((p) => p.id)).toEqual([1]);
  });

  it("excludes out-of-stock items when inStockOnly is set, keeps null stock (unmanaged)", () => {
    const items = [
      makeProduct({ id: 1, stock: 0 }),
      makeProduct({ id: 2, stock: 5 }),
      makeProduct({ id: 3, stock: null }),
    ];
    const result = filterAndSortProducts(items, { inStockOnly: true });
    expect(result.items.map((p) => p.id).sort()).toEqual([2, 3]);
  });

  it("sorts by price ascending using effective (sale) price", () => {
    const items = [
      makeProduct({ id: 1, price: 300000 }),
      makeProduct({ id: 2, price: 500000, sale_price: 100000 }),
      makeProduct({ id: 3, price: 200000 }),
    ];
    const result = filterAndSortProducts(items, { sort: "price_asc" });
    expect(result.items.map((p) => p.id)).toEqual([2, 3, 1]);
  });

  it("sorts by rating descending", () => {
    const items = [
      makeProduct({ id: 1, rating_avg: 3 }),
      makeProduct({ id: 2, rating_avg: 4.8 }),
      makeProduct({ id: 3, rating_avg: 4 }),
    ];
    const result = filterAndSortProducts(items, { sort: "rating" });
    expect(result.items.map((p) => p.id)).toEqual([2, 3, 1]);
  });

  it("sorts by newest by default", () => {
    const items = [
      makeProduct({ id: 1, createdAt: "2026-01-01T00:00:00Z" }),
      makeProduct({ id: 2, createdAt: "2026-03-01T00:00:00Z" }),
    ];
    const result = filterAndSortProducts(items, {});
    expect(result.items.map((p) => p.id)).toEqual([2, 1]);
  });

  it("paginates correctly", () => {
    const items = Array.from({ length: 25 }, (_, i) => makeProduct({ id: i + 1 }));
    const page1 = filterAndSortProducts(items, { page: 1, perPage: 10 });
    const page3 = filterAndSortProducts(items, { page: 3, perPage: 10 });
    expect(page1.items).toHaveLength(10);
    expect(page3.items).toHaveLength(5);
    expect(page1.total).toBe(25);
    expect(page1.pageCount).toBe(3);
  });
});
