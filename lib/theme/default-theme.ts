import type { ThemeData } from "@/lib/bakery/schemas";

/**
 * The original "Hồng phấn" theme exactly as `scripts/seed.ts` writes it —
 * used by the Theme Editor's "Khôi phục mặc định" button (mục 9.6.8).
 */
export const DEFAULT_THEME: ThemeData = {
  colors: {
    primary: "#C89B6B",
    secondary: "#F3E4D0",
    accent: "#5C3A21",
    background: "#FFFBF5",
    foreground: "#3A2A1D",
    muted: "#EFE3D3",
    success: "#8BC79A",
    destructive: "#E76A6A",
  },
  radius: "1.5rem",
  fonts: { heading: "Playfair Display", body: "Be Vietnam Pro" },
  hero: {
    variant: "pastel-3d",
    title: { vi: "Bánh kem tươi mỗi ngày, ngọt ngào mỗi khoảnh khắc", en: "Fresh cakes every day" },
    subtitle: { vi: "Đặt bánh online, giao tận nơi trong 2 giờ", en: "Order online, delivered in 2 hours" },
    image_url: "https://picsum.photos/seed/bakery-hero/1200/900",
    cta: { label: { vi: "Đặt bánh ngay" }, href: "/san-pham" },
  },
  sections: [
    { key: "hero", enabled: true, order: 1 },
    { key: "featured", enabled: true, order: 2, props: { limit: 8 } },
    { key: "story", enabled: true, order: 3 },
    { key: "categories", enabled: true, order: 4 },
    { key: "custom_cake", enabled: true, order: 5 },
    { key: "best_sellers", enabled: true, order: 6 },
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
};
