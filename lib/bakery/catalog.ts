import "server-only";

import { unstable_cache } from "next/cache";

import { createPublicClient } from "@/lib/supabase/public";

import {
  bannerDataSchema,
  categoryDataSchema,
  couponDataSchema,
  pageDataSchema,
  postDataSchema,
  productDataSchema,
  reviewDataSchema,
  type ProductData,
} from "./schemas";
import type { BakeryRow } from "./types";
import { filterAndSortProducts, type ProductListFilters, type ProductListItem } from "./product-list";

async function listActivePublic(type: string, orderBy: "sort_order" | "created_at" = "sort_order") {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("bakery")
    .select("*")
    .eq("type", type)
    .eq("status", "active")
    .order(orderBy, { ascending: orderBy === "sort_order" });
  if (error) throw error;
  return (data ?? []) as BakeryRow[];
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const getCategories = unstable_cache(
  async () => {
    const rows = await listActivePublic("category");
    // `slug` is nullable at the DB level generically, but every category we
    // write always sets one — filter defensively so callers get `string`.
    return rows
      .filter((r): r is typeof r & { slug: string } => r.slug !== null)
      .map((r) => ({ ...r, data: categoryDataSchema.parse(r.data) }));
  },
  ["bakery-categories"],
  { tags: ["categories"] },
);

export const getCategoryBySlug = unstable_cache(
  async (slug: string) => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("bakery")
      .select("*")
      .eq("type", "category")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...data, data: categoryDataSchema.parse(data.data) };
  },
  ["bakery-category-by-slug"],
  { tags: ["categories"] },
);

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

function rowToProductItem(row: Pick<BakeryRow, "id" | "slug" | "parent_id" | "created_at"> & { data: unknown }): ProductListItem {
  return {
    id: row.id,
    slug: row.slug ?? "",
    categoryId: row.parent_id,
    createdAt: row.created_at,
    data: productDataSchema.parse(row.data),
  };
}

/**
 * Products matching `filters` — search/price/badge filter and sort all run
 * in JS over a bounded fetch (see lib/bakery/product-list.ts). This project's
 * scale (single bakery, seed data ~24 products) doesn't need DB-side
 * aggregation; the plan's own single-table design flags >50k rows as the
 * point to reconsider (muc 4.1).
 */
export async function listProducts(filters: ProductListFilters = {}): Promise<{
  items: ProductListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}> {
  const supabase = createPublicClient();
  let categoryId: number | null = null;

  if (filters.categorySlug) {
    const category = await getCategoryBySlug(filters.categorySlug);
    if (!category) return { items: [], total: 0, page: filters.page ?? 1, perPage: filters.perPage ?? 12, pageCount: 1 };
    categoryId = category.id;
  }

  let items: ProductListItem[];
  if (filters.search && filters.search.trim()) {
    const { data, error } = await supabase.rpc("search_products", {
      search_query: filters.search.trim(),
      result_limit: 300,
    });
    if (error) throw error;
    items = (data ?? []).map(rowToProductItem);
    if (categoryId !== null) items = items.filter((p) => p.categoryId === categoryId);
  } else {
    let query = supabase.from("bakery").select("*").eq("type", "product").eq("status", "active").limit(500);
    if (categoryId !== null) query = query.eq("parent_id", categoryId);
    const { data, error } = await query;
    if (error) throw error;
    items = (data ?? []).map(rowToProductItem);
  }

  return filterAndSortProducts(items, filters);
}

export const getProductBySlug = unstable_cache(
  async (slug: string) => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("bakery")
      .select("*")
      .eq("type", "product")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...data, data: productDataSchema.parse(data.data) };
  },
  ["bakery-product-by-slug"],
  { tags: ["products"] },
);

export const getFeaturedProducts = unstable_cache(
  async (limit = 8) => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("bakery")
      .select("*")
      .eq("type", "product")
      .eq("status", "active")
      .eq("data->>is_featured", "true")
      .order("sort_order", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(rowToProductItem);
  },
  ["bakery-products-featured"],
  { tags: ["products"] },
);

export const getBestSellerProducts = unstable_cache(
  async (limit = 8) => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("bakery")
      .select("*")
      .eq("type", "product")
      .eq("status", "active")
      .eq("data->>is_best_seller", "true")
      .order("sort_order", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(rowToProductItem);
  },
  ["bakery-products-best-sellers"],
  { tags: ["products"] },
);

export const getRelatedProducts = unstable_cache(
  async (categoryId: number, excludeId: number, limit = 4) => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("bakery")
      .select("*")
      .eq("type", "product")
      .eq("status", "active")
      .eq("parent_id", categoryId)
      .neq("id", excludeId)
      .order("sort_order", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(rowToProductItem);
  },
  ["bakery-products-related"],
  { tags: ["products"] },
);

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------

export const getActiveBanners = unstable_cache(
  async () => {
    const rows = await listActivePublic("banner");
    const now = Date.now();
    return rows
      .map((r) => ({ ...r, data: bannerDataSchema.parse(r.data) }))
      .filter((b) => {
        const startsOk = !b.data.starts_at || new Date(b.data.starts_at).getTime() <= now;
        const endsOk = !b.data.ends_at || new Date(b.data.ends_at).getTime() >= now;
        return startsOk && endsOk;
      });
  },
  ["bakery-banners"],
  { tags: ["banners"] },
);

// ---------------------------------------------------------------------------
// Blog posts
// ---------------------------------------------------------------------------

export const getRecentPosts = unstable_cache(
  async (limit = 3) => {
    const rows = await listActivePublic("post", "created_at");
    return rows.slice(0, limit).map((r) => ({ ...r, data: postDataSchema.parse(r.data) }));
  },
  ["bakery-posts-recent"],
  { tags: ["posts"] },
);

export const getAllPosts = unstable_cache(
  async () => {
    const rows = await listActivePublic("post", "created_at");
    return rows.map((r) => ({ ...r, data: postDataSchema.parse(r.data) }));
  },
  ["bakery-posts-all"],
  { tags: ["posts"] },
);

export const getPostBySlug = unstable_cache(
  async (slug: string) => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("bakery")
      .select("*")
      .eq("type", "post")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...data, data: postDataSchema.parse(data.data) };
  },
  ["bakery-post-by-slug"],
  { tags: ["posts"] },
);

// ---------------------------------------------------------------------------
// Static pages
// ---------------------------------------------------------------------------

export const getPageBySlug = unstable_cache(
  async (slug: string) => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("bakery")
      .select("*")
      .eq("type", "page")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...data, data: pageDataSchema.parse(data.data) };
  },
  ["bakery-page-by-slug"],
  { tags: ["pages"] },
);

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export const getApprovedReviewsForProduct = unstable_cache(
  async (productId: number) => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("bakery")
      .select("*")
      .eq("type", "review")
      .eq("status", "approved")
      .eq("parent_id", productId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => ({ ...r, data: reviewDataSchema.parse(r.data) }));
  },
  ["bakery-reviews-for-product"],
  { tags: ["reviews"] },
);

export interface Testimonial {
  id: number;
  productId: number | null;
  productSlug: string | null;
  productName: string | null;
  author: string;
  rating: number;
  content: string;
}

export const getFeaturedTestimonials = unstable_cache(
  async (limit = 6): Promise<Testimonial[]> => {
    const supabase = createPublicClient();
    const { data: reviews, error } = await supabase
      .from("bakery")
      .select("*")
      .eq("type", "review")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    if (!reviews?.length) return [];

    const productIds = [...new Set(reviews.map((r) => r.parent_id).filter((id): id is number => id !== null))];
    const { data: products } = await supabase.from("bakery").select("id, slug, data").in("id", productIds);
    const productMap = new Map((products ?? []).map((p) => [p.id, p]));

    return reviews.map((r) => {
      const reviewData = reviewDataSchema.parse(r.data);
      const product = r.parent_id !== null ? productMap.get(r.parent_id) : undefined;
      const productData = product ? (product.data as { name?: { vi?: string } } | null) : null;
      return {
        id: r.id,
        productId: r.parent_id,
        productSlug: product?.slug ?? null,
        productName: productData?.name?.vi ?? null,
        author: reviewData.author,
        rating: reviewData.rating,
        content: reviewData.content,
      };
    });
  },
  ["bakery-testimonials"],
  { tags: ["reviews"] },
);

// ---------------------------------------------------------------------------
// Coupons (server-side validation only — see lib/bakery/coupon.ts for logic)
// ---------------------------------------------------------------------------

export async function getActiveCouponByCode(code: string) {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("bakery")
    .select("*")
    .eq("type", "coupon")
    .eq("slug", code.toUpperCase())
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { ...data, data: couponDataSchema.parse(data.data) };
}

export type { ProductData };
