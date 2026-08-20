import type { ProductData, SettingSiteData } from "@/lib/bakery/schemas";
import type { Locale } from "@/lib/bakery/types";
import { t } from "@/lib/i18n/text";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

/** muc 11: JSON-LD LocalBusiness cho trang chu, lay tu `setting`. */
export function LocalBusinessJsonLd({ settings, locale }: { settings: SettingSiteData; locale: Locale }) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "Bakery",
        name: t(settings.brand_name, locale),
        description: settings.tagline ? t(settings.tagline, locale) : undefined,
        image: settings.logo_url,
        telephone: settings.hotline,
        address: settings.address
          ? { "@type": "PostalAddress", addressCountry: "VN", streetAddress: t(settings.address, locale) }
          : undefined,
        url: SITE_URL,
        sameAs: Object.values(settings.socials ?? {}).filter(Boolean),
      }}
    />
  );
}

/** muc 8.3, 11: JSON-LD Product cho trang chi tiet san pham. */
export function ProductJsonLd({
  product,
  slug,
  locale,
}: {
  product: ProductData;
  slug: string;
  locale: Locale;
}) {
  const price = product.sale_price ?? product.price;
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: t(product.name, locale),
        description: product.short_description ? t(product.short_description, locale) : undefined,
        image: product.images,
        sku: product.sku,
        offers: {
          "@type": "Offer",
          url: `${SITE_URL}/san-pham/${slug}`,
          priceCurrency: "VND",
          price,
          availability:
            product.stock === null || product.stock === undefined || product.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
        },
        aggregateRating:
          product.rating_count > 0
            ? {
                "@type": "AggregateRating",
                ratingValue: product.rating_avg,
                reviewCount: product.rating_count,
              }
            : undefined,
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; path: string }> }) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: `${SITE_URL}${item.path}`,
        })),
      }}
    />
  );
}

export function ArticleJsonLd({
  title,
  description,
  imageUrl,
  publishedAt,
  author,
  path,
}: {
  title: string;
  description?: string;
  imageUrl?: string;
  publishedAt?: string;
  author?: string;
  path: string;
}) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        image: imageUrl,
        datePublished: publishedAt,
        author: author ? { "@type": "Person", name: author } : undefined,
        mainEntityOfPage: `${SITE_URL}${path}`,
      }}
    />
  );
}
