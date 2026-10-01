import type { Metadata } from "next";

import type { Locale } from "@/lib/bakery/types";
import { getSiteSettings } from "@/lib/bakery/queries";
import { t } from "@/lib/i18n/text";
import { getTranslations } from "next-intl/server";

/**
 * Builds page Metadata with hreflang alternates — muc 10 ("hreflang alternate
 * trong metadata; sitemap co ca 2 locale"). `path` is locale-free
 * (e.g. "/san-pham/banh-kem-dau-tay-1", "/" for home).
 */
export async function buildMetadata({
  title,
  description,
  ogImage,
  path,
  locale,
  searchParams,
}: {
  title: string;
  description?: string;
  ogImage?: string;
  path: string;
  locale: Locale;
  searchParams?: Record<string, string | string[] | undefined>;
}): Promise<Metadata> {
  // Next metadata merges nested OG fields shallowly: a child with undefined
  // description/images erased the configured defaults on catalog/list pages.
  const [settings, translations] = await Promise.all([
    getSiteSettings(), getTranslations({ locale, namespace: "Metadata" }),
  ]);
  const seo = settings?.data.seo;
  description ||= (seo?.description && t(seo.description, locale)) || translations("description");
  ogImage ||= seo?.og_image;
  const page = Number(searchParams?.page);
  const suffix = Number.isSafeInteger(page) && page > 1 ? `?page=${page}` : "";
  const viPath = (path === "/" ? "/" : path) + suffix;
  const enPath = (path === "/" ? "/en" : `/en${path}`) + suffix;
  const privatePage = /^\/(gio-hang|thanh-toan|tai-khoan|dat-hang-thanh-cong|tra-cuu-don-hang|dev)(\/|$)/.test(path);
  const filtered = Object.entries(searchParams ?? {}).some(([key, value]) => key !== "page" && Boolean(value));

  return {
    title,
    description,
    robots: privatePage || filtered ? { index: false, follow: !privatePage } : undefined,
    alternates: {
      canonical: locale === "en" ? enPath : viPath,
      languages: {
        vi: viPath,
        en: enPath,
      },
    },
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
      locale: locale === "vi" ? "vi_VN" : "en_US",
      type: "website",
      url: locale === "en" ? enPath : viPath,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}
