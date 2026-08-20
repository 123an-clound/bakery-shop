import { z } from "zod";

import { BAKERY_TYPES, type BakeryType } from "./types";

/** `{ vi: string; en?: string }` — Vietnamese is mandatory, English is optional. */
export const i18nTextSchema = z.object({
  vi: z.string().min(1),
  en: z.string().optional(),
});
export type I18nText = z.infer<typeof i18nTextSchema>;

const i18nOptionalTextSchema = z.object({
  vi: z.string(),
  en: z.string().optional(),
});

const moneySchema = z.number().nonnegative();
const vnPhoneSchema = z.string().regex(/^0\d{9}$/, "So dien thoai khong hop le");
const isoDateTimeSchema = z.string().datetime({ offset: true }).or(z.string().min(1));

const seoSchema = z
  .object({
    title: i18nOptionalTextSchema.optional(),
    description: i18nOptionalTextSchema.optional(),
    og_image: z.string().optional(),
  })
  .optional();

// ---------------------------------------------------------------------------
// setting (slug='site' — public; slug='private' — status=draft, server-only)
// ---------------------------------------------------------------------------

export const settingSiteDataSchema = z.object({
  brand_name: i18nTextSchema,
  tagline: i18nOptionalTextSchema.optional(),
  logo_url: z.string().optional(),
  favicon_url: z.string().optional(),
  hotline: z.string().optional(),
  email: z.email().optional(),
  address: i18nOptionalTextSchema.optional(),
  map_embed: z.string().optional(),
  opening_hours: i18nOptionalTextSchema.optional(),
  socials: z
    .object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      tiktok: z.string().optional(),
      zalo: z.string().optional(),
    })
    .optional(),
  bank: z
    .object({
      bank_code: z.string(),
      bank_name: z.string(),
      account_number: z.string(),
      account_name: z.string(),
      transfer_note_prefix: z.string(),
    })
    .optional(),
  shipping: z
    .object({
      fee: moneySchema,
      free_from: moneySchema,
      note: i18nOptionalTextSchema.optional(),
    })
    .optional(),
  seo: seoSchema,
});
export type SettingSiteData = z.infer<typeof settingSiteDataSchema>;

export const settingPrivateDataSchema = z.object({
  notify_emails: z.array(z.email()).default([]),
  internal_note: z.string().optional(),
});
export type SettingPrivateData = z.infer<typeof settingPrivateDataSchema>;

// ---------------------------------------------------------------------------
// theme (slug='default')
// ---------------------------------------------------------------------------

const homeSectionKeys = [
  "hero",
  "categories",
  "featured",
  "custom_cake",
  "best_sellers",
  "story",
  "testimonials",
  "blog",
  "instagram",
  "newsletter",
] as const;

export const themeDataSchema = z.object({
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    foreground: z.string(),
    muted: z.string(),
    success: z.string(),
    destructive: z.string(),
  }),
  radius: z.string(),
  fonts: z.object({
    heading: z.string(),
    body: z.string(),
  }),
  hero: z.object({
    variant: z.enum(["pastel-3d", "image-full", "video", "split"]),
    title: i18nOptionalTextSchema,
    subtitle: i18nOptionalTextSchema.optional(),
    image_url: z.string().optional(),
    cta: z
      .object({
        label: i18nOptionalTextSchema,
        href: z.string(),
      })
      .optional(),
  }),
  sections: z.array(
    z.object({
      key: z.enum(homeSectionKeys),
      enabled: z.boolean(),
      order: z.number().int(),
      props: z.record(z.string(), z.unknown()).optional(),
    }),
  ),
  effects: z.object({
    smooth_scroll: z.boolean(),
    confetti_on_add_to_cart: z.boolean(),
    parallax: z.boolean(),
    reduced_motion_respect: z.boolean(),
  }),
  announcement_bar: z.object({
    enabled: z.boolean(),
    text: i18nOptionalTextSchema,
    href: z.string().optional(),
  }),
});
export type ThemeData = z.infer<typeof themeDataSchema>;

// ---------------------------------------------------------------------------
// category
// ---------------------------------------------------------------------------

export const categoryDataSchema = z.object({
  name: i18nTextSchema,
  description: i18nOptionalTextSchema.optional(),
  image_url: z.string().optional(),
  icon: z.string().optional(),
  seo: seoSchema,
});
export type CategoryData = z.infer<typeof categoryDataSchema>;

// ---------------------------------------------------------------------------
// product
// ---------------------------------------------------------------------------

export const productOptionChoiceSchema = z.object({
  value: z.string(),
  label: i18nOptionalTextSchema,
  price_delta: z.number(),
});

export const productOptionSchema = z.object({
  key: z.string(),
  label: i18nOptionalTextSchema,
  choices: z.array(productOptionChoiceSchema).min(1),
});

export const productDataSchema = z.object({
  name: i18nTextSchema,
  short_description: i18nOptionalTextSchema.optional(),
  description: i18nOptionalTextSchema.optional(),
  sku: z.string().optional(),
  price: moneySchema,
  sale_price: moneySchema.nullable().optional(),
  unit: i18nOptionalTextSchema.optional(),
  images: z.array(z.string()).default([]),
  stock: z.number().int().nullable().optional(),
  is_featured: z.boolean().default(false),
  is_best_seller: z.boolean().default(false),
  badges: z.array(z.string()).default([]),
  options: z.array(productOptionSchema).default([]),
  ingredients: i18nOptionalTextSchema.optional(),
  allergens: z.array(z.string()).default([]),
  prep_time_hours: z.number().int().nonnegative().default(24),
  rating_avg: z.number().min(0).max(5).default(0),
  rating_count: z.number().int().nonnegative().default(0),
  seo: seoSchema,
});
export type ProductData = z.infer<typeof productDataSchema>;

// ---------------------------------------------------------------------------
// banner
// ---------------------------------------------------------------------------

export const bannerDataSchema = z.object({
  title: i18nOptionalTextSchema.optional(),
  subtitle: i18nOptionalTextSchema.optional(),
  image_url: z.string(),
  image_mobile_url: z.string().optional(),
  href: z.string().optional(),
  cta_label: i18nOptionalTextSchema.optional(),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
});
export type BannerData = z.infer<typeof bannerDataSchema>;

// ---------------------------------------------------------------------------
// post
// ---------------------------------------------------------------------------

export const postDataSchema = z.object({
  title: i18nTextSchema,
  excerpt: i18nOptionalTextSchema.optional(),
  content: i18nOptionalTextSchema,
  cover_url: z.string().optional(),
  author: z.string().default("Admin"),
  tags: z.array(z.string()).default([]),
  published_at: isoDateTimeSchema.optional(),
  seo: seoSchema,
});
export type PostData = z.infer<typeof postDataSchema>;

// ---------------------------------------------------------------------------
// page
// ---------------------------------------------------------------------------

export const pageDataSchema = z.object({
  title: i18nTextSchema,
  content: i18nOptionalTextSchema,
  cover_url: z.string().optional(),
  seo: seoSchema,
});
export type PageData = z.infer<typeof pageDataSchema>;

// ---------------------------------------------------------------------------
// order / order_item
// ---------------------------------------------------------------------------

export const orderAddressSchema = z.object({
  line: z.string().min(1),
  ward: z.string().optional(),
  district: z.string().optional(),
  city: z.string().min(1),
});

export const orderItemSnapshotSchema = z.object({
  product_id: z.number().int(),
  name: z.string(),
  image: z.string().optional(),
  unit_price: moneySchema,
  qty: z.number().int().positive(),
  options: z.record(z.string(), z.string()).default({}),
  line_total: moneySchema,
});

export const orderTimelineEntrySchema = z.object({
  status: z.string(),
  at: z.string(),
  by: z.string(),
  note: z.string().optional(),
});

export const orderDataSchema = z.object({
  code: z.string(),
  user_id: z.string().nullable().optional(),
  customer_name: z.string().min(1),
  phone: vnPhoneSchema,
  email: z.email().optional(),
  address: orderAddressSchema,
  delivery_at: z.string(),
  note: z.string().optional(),
  payment_method: z.enum(["cod", "bank_transfer"]),
  payment_status: z.enum(["unpaid", "paid", "refunded"]).default("unpaid"),
  coupon_code: z.string().nullable().optional(),
  subtotal: moneySchema,
  discount: moneySchema.default(0),
  shipping_fee: moneySchema.default(0),
  total: moneySchema,
  items_snapshot: z.array(orderItemSnapshotSchema).min(1),
  timeline: z.array(orderTimelineEntrySchema).default([]),
  internal_note: z.string().optional(),
});
export type OrderData = z.infer<typeof orderDataSchema>;

export const orderItemDataSchema = z.object({
  product_id: z.number().int(),
  name: z.string(),
  qty: z.number().int().positive(),
  unit_price: moneySchema,
  options: z.record(z.string(), z.string()).default({}),
  line_total: moneySchema,
});
export type OrderItemData = z.infer<typeof orderItemDataSchema>;

// ---------------------------------------------------------------------------
// custom_cake
// ---------------------------------------------------------------------------

export const customCakeDataSchema = z.object({
  customer_name: z.string().min(1),
  phone: vnPhoneSchema,
  email: z.email().optional(),
  size: z.string(),
  layers: z.number().int().positive(),
  sponge: z.string(),
  cream: z.string(),
  flavor: z.string(),
  message_on_cake: z.string().optional(),
  color_theme: z.string().optional(),
  budget: moneySchema.optional(),
  need_at: z.string(),
  reference_images: z.array(z.string()).max(3).default([]),
  note: z.string().optional(),
  quoted_price: moneySchema.nullable().optional(),
  admin_reply: z.string().nullable().optional(),
});
export type CustomCakeData = z.infer<typeof customCakeDataSchema>;

// ---------------------------------------------------------------------------
// review
// ---------------------------------------------------------------------------

export const reviewDataSchema = z.object({
  author: z.string().min(1),
  user_id: z.string().nullable().optional(),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(1),
  images: z.array(z.string()).default([]),
  order_code: z.string().optional(),
});
export type ReviewData = z.infer<typeof reviewDataSchema>;

// ---------------------------------------------------------------------------
// coupon (slug = code, uppercase)
// ---------------------------------------------------------------------------

export const couponDataSchema = z.object({
  code: z.string().min(1),
  discount_type: z.enum(["percent", "fixed"]),
  value: z.number().positive(),
  max_discount: moneySchema.nullable().optional(),
  min_order: moneySchema.default(0),
  usage_limit: z.number().int().positive().nullable().optional(),
  used_count: z.number().int().nonnegative().default(0),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
  description: i18nOptionalTextSchema.optional(),
});
export type CouponData = z.infer<typeof couponDataSchema>;

// ---------------------------------------------------------------------------
// customer
// ---------------------------------------------------------------------------

export const customerDataSchema = z.object({
  user_id: z.string(),
  full_name: z.string().optional(),
  phone: vnPhoneSchema.optional(),
  addresses: z.array(orderAddressSchema).default([]),
  birthday: z.string().nullable().optional(),
  points: z.number().int().nonnegative().default(0),
});
export type CustomerData = z.infer<typeof customerDataSchema>;

// ---------------------------------------------------------------------------
// favorite
// ---------------------------------------------------------------------------

export const favoriteDataSchema = z.object({
  user_id: z.string(),
});
export type FavoriteData = z.infer<typeof favoriteDataSchema>;

// ---------------------------------------------------------------------------
// media
// ---------------------------------------------------------------------------

export const mediaDataSchema = z.object({
  url: z.string(),
  path: z.string(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  size: z.number().int().positive(),
  mime: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]),
  alt: i18nOptionalTextSchema.optional(),
});
export type MediaData = z.infer<typeof mediaDataSchema>;

// ---------------------------------------------------------------------------
// Dispatch table — one schema per `type`, keyed by BakeryType.
// Used by lib/bakery/mutations.ts to validate `data` before every write.
// ---------------------------------------------------------------------------

export const bakeryDataSchemas = {
  setting: settingSiteDataSchema.or(settingPrivateDataSchema),
  theme: themeDataSchema,
  category: categoryDataSchema,
  product: productDataSchema,
  banner: bannerDataSchema,
  page: pageDataSchema,
  post: postDataSchema,
  order: orderDataSchema,
  order_item: orderItemDataSchema,
  custom_cake: customCakeDataSchema,
  review: reviewDataSchema,
  coupon: couponDataSchema,
  customer: customerDataSchema,
  favorite: favoriteDataSchema,
  media: mediaDataSchema,
} as const satisfies Record<BakeryType, z.ZodTypeAny>;

/** Runtime guard so bakeryDataSchemas is proven to cover every BakeryType. */
export function assertAllBakeryTypesHaveSchema(): void {
  for (const type of BAKERY_TYPES) {
    if (!(type in bakeryDataSchemas)) {
      throw new Error(`Missing Zod schema for bakery type "${type}"`);
    }
  }
}

export function parseBakeryData<T extends BakeryType>(type: T, data: unknown) {
  return bakeryDataSchemas[type].parse(data);
}
