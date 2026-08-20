import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Chan /admin va /api — muc 11. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/*/dev/ui", "/dev/ui"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
