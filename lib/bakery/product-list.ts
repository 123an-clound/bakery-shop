import type { ProductData } from "./schemas";

export interface ProductListItem {
  id: number;
  slug: string;
  categoryId: number | null;
  createdAt: string;
  data: ProductData;
}

export type ProductSort = "newest" | "price_asc" | "price_desc" | "rating" | "best_selling";

export interface ProductListFilters {
  categorySlug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  badge?: string;
  inStockOnly?: boolean;
  sort?: ProductSort;
  page?: number;
  perPage?: number;
}

function effectivePrice(item: ProductListItem): number {
  return item.data.sale_price ?? item.data.price;
}

/**
 * Pure filter + sort + paginate over an already-fetched candidate set — kept
 * separate from the Supabase-calling code in catalog.ts so it's unit
 * testable without a live DB (tests/unit/product-list.test.ts).
 */
export function filterAndSortProducts(
  items: ProductListItem[],
  filters: ProductListFilters,
): { items: ProductListItem[]; total: number; page: number; perPage: number; pageCount: number } {
  let result = items;

  if (filters.minPrice !== undefined) {
    result = result.filter((p) => effectivePrice(p) >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    result = result.filter((p) => effectivePrice(p) <= filters.maxPrice!);
  }
  if (filters.badge) {
    result = result.filter((p) => p.data.badges.includes(filters.badge!));
  }
  if (filters.inStockOnly) {
    result = result.filter((p) => p.data.stock === null || p.data.stock === undefined || p.data.stock > 0);
  }

  const sort = filters.sort ?? "newest";
  result = [...result].sort((a, b) => {
    switch (sort) {
      case "price_asc":
        return effectivePrice(a) - effectivePrice(b);
      case "price_desc":
        return effectivePrice(b) - effectivePrice(a);
      case "rating":
        return b.data.rating_avg - a.data.rating_avg;
      case "best_selling":
        return Number(b.data.is_best_seller) - Number(a.data.is_best_seller);
      case "newest":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const perPage = filters.perPage && filters.perPage > 0 ? filters.perPage : 12;
  const total = result.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  const paged = result.slice(start, start + perPage);

  return { items: paged, total, page, perPage, pageCount };
}
