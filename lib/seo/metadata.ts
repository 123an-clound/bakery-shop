import type { Metadata } from "next";

import type { Locale } from "@/lib/bakery/types";

/**
 * Builds page Metadata with hreflang alternates — muc 10 ("hreflang alternate
 * trong metadata; sitemap co ca 2 locale"). `path` is locale-free
 * (e.g. "/san-pham/banh-kem-dau-tay-1", "/" for home).
 */
export function buildMetadata({
  title,
  description,
  ogImage,
  path,
  locale,
}: {
  title: string;
  description?: string;
  ogImage?: string;
  path: string;
  locale: Locale;
}): Metadata {
  const viPath = path === "/" ? "/" : path;
  const enPath = path === "/" ? "/en" : `/en${path}`;

  return {
    title,
    description,
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
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}
