import type { ThemeData } from "@/lib/bakery/schemas";

/**
 * The premium patisserie theme (plan.md: gold / ivory / charcoal) —
 * used by the Theme Editor's "Khôi phục mặc định" button (mục 9.6.8).
 */
export const DEFAULT_THEME: ThemeData = {
  colors: {
    primary: "#D4AF37",
    secondary: "#FDF2E9",
    accent: "#7A5C22",
    background: "#FAFAFA",
    foreground: "#2C2C2C",
    muted: "#F4EEE6",
    success: "#8BC79A",
    destructive: "#B84545",
  },
  radius: "0.75rem",
  fonts: { heading: "Playfair Display", body: "Inter" },
  hero: {
    variant: "image-full",
    title: { vi: "Nghệ thuật bánh ngọt Pháp, làm thủ công mỗi ngày", en: "The art of French pâtisserie, handmade daily" },
    subtitle: {
      vi: "Bánh kem, pastry và quà tặng tinh tế — đặt online, giao tận nơi trong 2 giờ.",
      en: "Cakes, pastries and refined gifts — order online, delivered within 2 hours.",
    },
    image_url: "https://images.unsplash.com/photo-1566760375903-061dfd31c175?auto=format&fit=crop&w=2400&q=80",
    cta: { label: { vi: "Khám phá thực đơn", en: "Explore menu" }, href: "/san-pham" },
  },
  sections: [
    { key: "hero", enabled: true, order: 1 },
    { key: "featured", enabled: true, order: 2, props: { limit: 8 } },
    { key: "categories", enabled: true, order: 3 },
    { key: "story", enabled: true, order: 4 },
    { key: "best_sellers", enabled: true, order: 5 },
    { key: "custom_cake", enabled: true, order: 6 },
    { key: "testimonials", enabled: true, order: 7 },
    { key: "blog", enabled: true, order: 8 },
    // The footer already carries the Instagram grid + newsletter form.
    { key: "instagram", enabled: false, order: 9 },
    { key: "newsletter", enabled: false, order: 10 },
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
