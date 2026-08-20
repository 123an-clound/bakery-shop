import type { MetadataRoute } from "next";

import { getAllPosts, getCategories, listProducts } from "@/lib/bakery/catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function localizedUrls(path: string): { url: string; lang: Record<string, string> } {
  return {
    url: `${SITE_URL}${path}`,
    lang: {
      vi: `${SITE_URL}${path}`,
      en: `${SITE_URL}/en${path}`,
    },
  };
}

const STATIC_PATHS = [
  "/",
  "/san-pham",
  "/dat-banh-theo-yeu-cau",
  "/tin-tuc",
  "/gioi-thieu",
  "/lien-he",
  "/tra-cuu-don-hang",
  "/chinh-sach-giao-hang",
  "/dieu-khoan",
];

/** Sinh dong tu Supabase (san pham, danh muc, bai viet), ca 2 locale — muc 11. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, posts] = await Promise.all([
    listProducts({ perPage: 1000 }),
    getCategories(),
    getAllPosts(),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  for (const path of STATIC_PATHS) {
    const { url, lang } = localizedUrls(path);
    entries.push({
      url,
      alternates: { languages: lang },
      changeFrequency: "weekly",
      priority: path === "/" ? 1 : 0.7,
    });
  }

  for (const category of categories) {
    const { url, lang } = localizedUrls(`/danh-muc/${category.slug}`);
    entries.push({ url, alternates: { languages: lang }, changeFrequency: "weekly", priority: 0.6 });
  }

  for (const product of products.items) {
    const { url, lang } = localizedUrls(`/san-pham/${product.slug}`);
    entries.push({ url, alternates: { languages: lang }, changeFrequency: "weekly", priority: 0.8 });
  }

  for (const post of posts) {
    const { url, lang } = localizedUrls(`/tin-tuc/${post.slug}`);
    entries.push({ url, alternates: { languages: lang }, changeFrequency: "monthly", priority: 0.5 });
  }

  return entries;
}

export const revalidate = 3600;
