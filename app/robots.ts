import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Chan /admin, /api, va cac trang giao dich khong co gia tri SEO — muc 11. */
export default function robots(): MetadataRoute.Robots {
  const transactional = ["/gio-hang", "/thanh-toan", "/dat-hang-thanh-cong", "/tai-khoan"];
  const disallow = [
    "/admin",
    "/api",
    "/*/dev/ui",
    "/dev/ui",
    ...transactional,
    ...transactional.map((p) => `/en${p}`),
  ];
  return {
    rules: { userAgent: "*", allow: "/", disallow },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
