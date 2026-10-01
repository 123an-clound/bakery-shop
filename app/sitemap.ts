import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { getSiteUrl } from "@/lib/seo/site-url";

/** Only active canonical public routes, both locales, real modification dates. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (process.env.VERCEL_ENV === "preview" || process.env.SITE_NOINDEX === "true") return [];
  const origin = getSiteUrl();
  const entries: MetadataRoute.Sitemap = [];
  function add(path: string, modified?: string) {
    const vi = origin + path;
    const en = origin + (path === "/" ? "/en" : "/en" + path);
    for (const url of [vi, en]) entries.push({ url, alternates: { languages: { vi, en } }, ...(modified ? { lastModified: modified } : {}) });
  }
  for (const path of ["/", "/san-pham", "/dat-banh-theo-yeu-cau", "/tin-tuc", "/lien-he"]) add(path);
  const client = createPublicClient();
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from("bakery").select("id,type,slug,updated_at")
      .in("type", ["product", "category", "post", "page"]).eq("status", "active").not("slug", "is", null)
      .order("id").range(offset, offset + 499);
    if (error) throw error;
    for (const row of data ?? []) {
      const prefix = { product: "/san-pham/", category: "/danh-muc/", post: "/tin-tuc/" }[row.type];
      if (prefix) add(prefix + row.slug, row.updated_at);
      else if (["gioi-thieu", "chinh-sach-giao-hang", "dieu-khoan"].includes(row.slug ?? "")) add("/" + row.slug, row.updated_at);
    }
    if (!data || data.length < 500) break;
  }
  return entries;
}
export const revalidate = 3600;
