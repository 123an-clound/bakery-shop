/**
 * Seed du lieu mau cho bang public.bakery — muc 4.6 KE-HOACH-DU-AN.md.
 * Chay: pnpm seed
 *
 * Anh dung placeholder Lorem Picsum (seeded, on dinh, khong vi pham ban quyen) —
 * chu tiem thay bang anh that qua trang admin sau. Xem README.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

import type { Database, Json } from "../lib/supabase/database.types";
import { bakeryDataSchemas } from "../lib/bakery/schemas";
import type { BakeryType } from "../lib/bakery/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  throw new Error("Thieu NEXT_PUBLIC_SUPABASE_URL hoac SUPABASE_SERVICE_ROLE_KEY trong .env.local");
}

const supabase = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function img(seed: string, w = 800, h = 800) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface SeedRow {
  type: BakeryType;
  slug?: string | null;
  parentId?: number | null;
  status?: string;
  sortOrder?: number;
  data: unknown;
}

async function insertRow(row: SeedRow): Promise<number> {
  const parsed = bakeryDataSchemas[row.type].parse(row.data);
  const { data, error } = await supabase
    .from("bakery")
    .insert({
      type: row.type,
      slug: row.slug ?? null,
      parent_id: row.parentId ?? null,
      status: row.status ?? "active",
      sort_order: row.sortOrder ?? 0,
      data: parsed as unknown as Json,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Insert ${row.type} (${row.slug ?? ""}) that bai: ${error.message}`);
  return data.id;
}

async function main() {
  const { count, error: countError } = await supabase
    .from("bakery")
    .select("*", { count: "exact", head: true });
  if (countError) throw countError;
  if (count && count > 0) {
    throw new Error(
      `Bang bakery da co ${count} dong. Seed script chi chay tren bang trong de tranh trung du lieu. ` +
        `Xoa du lieu cu (neu chac chan muon) roi chay lai.`,
    );
  }

  console.log("Seeding setting + theme...");
  await insertRow({
    type: "setting",
    slug: "site",
    status: "active",
    data: {
      brand_name: { vi: "Tiệm Bánh Ngọt Ngào", en: "Sweet Bakery" },
      tagline: { vi: "Ngọt ngào từng chiếc bánh, ấm áp từng khoảnh khắc", en: "Sweetness in every slice" },
      logo_url: img("bakery-logo", 200, 200),
      favicon_url: img("bakery-favicon", 64, 64),
      hotline: "0900 000 000",
      email: "hello@tiembanhngotngao.vn",
      address: { vi: "123 Đường Nguyễn Huệ, Quận 1, TP.HCM", en: "123 Nguyen Hue Street, District 1, HCMC" },
      opening_hours: { vi: "7:00 - 21:00 hằng ngày", en: "7:00 AM - 9:00 PM daily" },
      socials: { facebook: "", instagram: "", tiktok: "", zalo: "" },
      shipping: {
        fee: 25000,
        free_from: 500000,
        note: { vi: "Freeship nội thành cho đơn từ 500.000₫", en: "Free shipping in-city for orders over 500,000 VND" },
      },
      seo: {
        title: { vi: "Tiệm Bánh Ngọt Ngào — Bánh kem & bánh ngọt tươi mỗi ngày" },
        description: { vi: "Bánh kem sinh nhật, cupcake, cookie... đặt online, giao tận nơi tại TP.HCM." },
      },
    },
  });

  await insertRow({
    type: "setting",
    slug: "private",
    status: "draft",
    data: {
      notify_emails: ["hello@tiembanhngotngao.vn"],
      internal_note: "Du lieu mau Phase 1 — chinh sua trong /admin/cai-dat.",
    },
  });

  await insertRow({
    type: "theme",
    slug: "default",
    status: "active",
    data: {
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
      hero: {
        variant: "pastel-3d",
        title: { vi: "Bánh kem tươi mỗi ngày, ngọt ngào mỗi khoảnh khắc", en: "Fresh cakes every day" },
        subtitle: { vi: "Đặt bánh online, giao tận nơi trong 2 giờ", en: "Order online, delivered in 2 hours" },
        image_url: img("bakery-hero", 1200, 900),
        cta: { label: { vi: "Đặt bánh ngay" }, href: "/san-pham" },
      },
      sections: [
        { key: "hero", enabled: true, order: 1 },
        { key: "categories", enabled: true, order: 2 },
        { key: "featured", enabled: true, order: 3, props: { limit: 8 } },
        { key: "custom_cake", enabled: true, order: 4 },
        { key: "best_sellers", enabled: true, order: 5 },
        { key: "story", enabled: true, order: 6 },
        { key: "testimonials", enabled: true, order: 7 },
        { key: "blog", enabled: false, order: 8 },
        { key: "instagram", enabled: false, order: 9 },
        { key: "newsletter", enabled: true, order: 10 },
      ],
      effects: {
        smooth_scroll: true,
        confetti_on_add_to_cart: true,
        parallax: true,
        reduced_motion_respect: true,
      },
      announcement_bar: {
        enabled: true,
        text: { vi: "Freeship đơn từ 500k 🎂" },
        href: "/san-pham",
      },
    },
  });

  console.log("Seeding categories...");
  const categoryDefs = [
    { vi: "Bánh kem sinh nhật", en: "Birthday Cakes", icon: "cake" },
    { vi: "Bánh ngọt / Pastry", en: "Pastries", icon: "croissant" },
    { vi: "Bánh mì ngọt", en: "Sweet Bread", icon: "wheat" },
    { vi: "Cupcake & Muffin", en: "Cupcakes & Muffins", icon: "cupcake" },
    { vi: "Cookie & Quà tặng", en: "Cookies & Gifts", icon: "cookie" },
    { vi: "Bánh theo mùa", en: "Seasonal Cakes", icon: "sparkles" },
  ];
  const categoryIds: number[] = [];
  for (let i = 0; i < categoryDefs.length; i++) {
    const c = categoryDefs[i]!;
    const id = await insertRow({
      type: "category",
      slug: slugify(c.vi),
      sortOrder: i,
      data: {
        name: { vi: c.vi, en: c.en },
        description: { vi: `Bộ sưu tập ${c.vi.toLowerCase()} đa dạng, tươi mới mỗi ngày.` },
        image_url: img(`category-${i}`, 600, 600),
        icon: c.icon,
      },
    });
    categoryIds.push(id);
  }

  console.log("Seeding products...");
  const productNames: Array<[string, string]> = [
    ["Bánh kem dâu tây", "Strawberry Cake"],
    ["Bánh kem socola", "Chocolate Cake"],
    ["Bánh kem matcha", "Matcha Cake"],
    ["Bánh kem hoa hồng", "Rose Cake"],
    ["Bánh su kem", "Cream Puff"],
    ["Bánh tiramisu", "Tiramisu"],
    ["Bánh mousse xoài", "Mango Mousse Cake"],
    ["Bánh croissant bơ", "Butter Croissant"],
    ["Bánh mì hoa cúc", "Chiffon Sweet Bread"],
    ["Bánh mì nho khô", "Raisin Sweet Bread"],
    ["Bánh mì phô mai", "Cheese Sweet Bread"],
    ["Bánh mì socola chip", "Chocolate Chip Bread"],
    ["Cupcake vani", "Vanilla Cupcake"],
    ["Cupcake red velvet", "Red Velvet Cupcake"],
    ["Muffin việt quất", "Blueberry Muffin"],
    ["Muffin chuối", "Banana Muffin"],
    ["Cookie bơ đậu phộng", "Peanut Butter Cookie"],
    ["Cookie socola chip", "Chocolate Chip Cookie"],
    ["Hộp quà cookie 12 cái", "Cookie Gift Box (12pcs)"],
    ["Hộp quà bánh quy bơ", "Butter Cookie Gift Box"],
    ["Bánh trung thu đậu xanh", "Mooncake Mung Bean"],
    ["Bánh Giáng sinh khúc gỗ", "Christmas Yule Log"],
    ["Bánh Halloween bí ngô", "Halloween Pumpkin Cake"],
    ["Bánh Tết bánh chưng ngọt", "Tet Sweet Cake"],
  ];

  let productIndex = 0;
  for (let ci = 0; ci < categoryIds.length; ci++) {
    for (let pi = 0; pi < 4; pi++) {
      const [nameVi, nameEn] = productNames[productIndex]!;
      const basePrice = 120000 + productIndex * 15000;
      const isFeatured = productIndex % 3 === 0 && productIndex < 24;
      await insertRow({
        type: "product",
        slug: `${slugify(nameVi)}-${productIndex + 1}`,
        parentId: categoryIds[ci]!,
        sortOrder: pi,
        data: {
          name: { vi: nameVi, en: nameEn },
          short_description: { vi: `${nameVi} thơm ngon, tươi mới, làm thủ công mỗi ngày.` },
          description: { vi: `<p>${nameVi} được làm từ nguyên liệu tự nhiên, không chất bảo quản.</p>` },
          sku: `BK-${String(productIndex + 1).padStart(3, "0")}`,
          price: basePrice,
          sale_price: productIndex % 5 === 0 ? Math.round(basePrice * 0.85) : null,
          unit: { vi: "cái" },
          images: [img(`product-${productIndex}-a`), img(`product-${productIndex}-b`)],
          stock: 20,
          is_featured: isFeatured,
          is_best_seller: productIndex % 7 === 0,
          badges: productIndex % 4 === 0 ? ["new"] : [],
          options:
            categoryDefs[ci]!.icon === "cake"
              ? [
                  {
                    key: "size",
                    label: { vi: "Kích thước" },
                    choices: [
                      { value: "16cm", label: { vi: "16cm" }, price_delta: 0 },
                      { value: "20cm", label: { vi: "20cm" }, price_delta: 120000 },
                    ],
                  },
                ]
              : [],
          allergens: ["gluten", "dairy", "egg"],
          prep_time_hours: 4,
          rating_avg: 0,
          rating_count: 0,
        },
      });
      productIndex++;
    }
  }

  console.log("Seeding banners...");
  for (let i = 0; i < 3; i++) {
    await insertRow({
      type: "banner",
      sortOrder: i,
      data: {
        title: { vi: `Ưu đãi bánh kem tuần ${i + 1}` },
        subtitle: { vi: "Giảm giá đến 15% cho đơn đầu tiên" },
        image_url: img(`banner-${i}`, 1600, 600),
        image_mobile_url: img(`banner-${i}-mobile`, 800, 800),
        href: "/san-pham",
        cta_label: { vi: "Xem ngay" },
      },
    });
  }

  console.log("Seeding blog posts...");
  const postDefs = [
    "5 mẹo chọn bánh kem sinh nhật hoàn hảo",
    "Bí quyết bảo quản bánh kem tươi lâu",
    "Xu hướng bánh cưới pastel 2026",
  ];
  for (let i = 0; i < postDefs.length; i++) {
    const title = postDefs[i]!;
    await insertRow({
      type: "post",
      slug: slugify(title),
      sortOrder: i,
      data: {
        title: { vi: title },
        excerpt: { vi: `${title} — chia sẻ từ đội ngũ thợ bánh của tiệm.` },
        content: { vi: `<p>${title}. Nội dung chi tiết sẽ được cập nhật.</p>` },
        cover_url: img(`post-${i}`, 1200, 700),
        author: "Admin",
        tags: ["meo-vat"],
        published_at: new Date(2026, 6, i + 1).toISOString(),
      },
    });
  }

  console.log("Seeding static pages...");
  const pageDefs: Array<{ slug: string; title: string }> = [
    { slug: "gioi-thieu", title: "Giới thiệu" },
    { slug: "lien-he", title: "Liên hệ" },
    { slug: "chinh-sach-giao-hang", title: "Chính sách giao hàng" },
    { slug: "dieu-khoan", title: "Điều khoản sử dụng" },
  ];
  for (const p of pageDefs) {
    await insertRow({
      type: "page",
      slug: p.slug,
      data: {
        title: { vi: p.title },
        content: { vi: `<p>Nội dung trang "${p.title}" — chỉnh sửa trong /admin/bai-viet.</p>` },
      },
    });
  }

  console.log("Seeding coupons...");
  await insertRow({
    type: "coupon",
    slug: "SINHNHAT10",
    data: {
      code: "SINHNHAT10",
      discount_type: "percent",
      value: 10,
      max_discount: 100000,
      min_order: 300000,
      usage_limit: 100,
      used_count: 3,
      description: { vi: "Giảm 10% cho đơn từ 300.000₫" },
    },
  });
  await insertRow({
    type: "coupon",
    slug: "FREESHIP",
    data: {
      code: "FREESHIP",
      discount_type: "fixed",
      value: 25000,
      min_order: 200000,
      usage_limit: 200,
      used_count: 10,
      description: { vi: "Miễn phí ship cho đơn từ 200.000₫" },
    },
  });

  console.log("Seeding reviews...");
  // Fetch inserted products to attach reviews to.
  const { data: products, error: productsError } = await supabase
    .from("bakery")
    .select("id, data")
    .eq("type", "product")
    .order("id", { ascending: true })
    .limit(6);
  if (productsError) throw productsError;

  const reviewAuthors = ["Minh", "Lan", "Huy", "Trang", "Phúc", "An"];
  for (let i = 0; i < (products?.length ?? 0); i++) {
    const product = products![i]!;
    await insertRow({
      type: "review",
      parentId: product.id,
      status: "approved",
      data: {
        author: reviewAuthors[i % reviewAuthors.length]!,
        rating: 4 + (i % 2),
        content: "Bánh rất ngon, giao hàng đúng giờ, đóng gói cẩn thận!",
      },
    });
  }

  console.log("Seeding sample orders...");
  const orderStatuses = ["pending", "confirmed", "completed"] as const;
  for (let i = 0; i < 3; i++) {
    const p = products?.[i];
    const unitPrice = 300000 + i * 50000;
    await insertRow({
      type: "order",
      status: orderStatuses[i],
      data: {
        code: `BK26082${i}-000${i}`,
        customer_name: `Khách hàng mẫu ${i + 1}`,
        phone: "0912345678",
        email: `khach${i + 1}@example.com`,
        address: { line: "12 Lê Lợi", ward: "Phường Bến Nghé", district: "Quận 1", city: "TP.HCM" },
        delivery_at: new Date(2026, 7, 22 + i, 15, 0).toISOString(),
        payment_method: i % 2 === 0 ? "cod" : "bank_transfer",
        payment_status: orderStatuses[i] === "completed" ? "paid" : "unpaid",
        subtotal: unitPrice,
        discount: 0,
        shipping_fee: 0,
        total: unitPrice,
        items_snapshot: [
          {
            product_id: p?.id ?? 1,
            name: (p?.data as { name?: { vi?: string } } | undefined)?.name?.vi ?? "Bánh kem mẫu",
            unit_price: unitPrice,
            qty: 1,
            line_total: unitPrice,
          },
        ],
        timeline: [{ status: orderStatuses[i], at: new Date().toISOString(), by: "system", note: "Seed data" }],
      },
    });
  }

  console.log("Seed hoan tat.");
}

async function printCountsByType() {
  const { data, error } = await supabase.from("bakery").select("type");
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data) counts.set(row.type, (counts.get(row.type) ?? 0) + 1);
  console.log("So dong theo type:", Object.fromEntries(counts));
}

main()
  .then(printCountsByType)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
