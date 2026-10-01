import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";

const SITE_URL = getSiteUrl();

/** Chan /admin, /api, va cac trang giao dich khong co gia tri SEO — muc 11. */
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === "preview" || process.env.SITE_NOINDEX === "true") return { rules: { userAgent: "*", disallow: "/" } };
  const disallow = [
    "/admin",
    "/api",
    "/*/dev/ui",
    "/dev/ui",
  ];
  return {
    rules: { userAgent: "*", allow: "/", disallow },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
