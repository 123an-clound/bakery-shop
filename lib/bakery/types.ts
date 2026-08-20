export const LOCALES = ["vi", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const BAKERY_TYPES = [
  "setting",
  "theme",
  "category",
  "product",
  "banner",
  "page",
  "post",
  "order",
  "order_item",
  "custom_cake",
  "review",
  "coupon",
  "customer",
  "favorite",
  "media",
] as const;
export type BakeryType = (typeof BAKERY_TYPES)[number];

export const CONTENT_STATUSES = ["active", "draft", "archived"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "baking",
  "delivering",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const COUPON_STATUSES = ["active", "expired", "disabled"] as const;
export type CouponStatus = (typeof COUPON_STATUSES)[number];

export const CUSTOM_CAKE_STATUSES = ["new", "quoted", "accepted", "rejected"] as const;
export type CustomCakeStatus = (typeof CUSTOM_CAKE_STATUSES)[number];

/** Raw row shape as returned by Supabase for the single `public.bakery` table. */
export interface BakeryRow {
  id: number;
  created_at: string;
  updated_at: string;
  type: BakeryType;
  slug: string | null;
  parent_id: number | null;
  status: string;
  sort_order: number;
  data: unknown;
}
