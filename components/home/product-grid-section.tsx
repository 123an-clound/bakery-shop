import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { ProductListItem } from "@/lib/bakery/product-list";
import type { Locale } from "@/lib/bakery/types";
import { ProductCard } from "@/components/product/product-card";
import { FadeIn } from "@/components/motion/fade-in";

export function ProductGridSection({
  title,
  products,
  locale,
  viewAllHref,
  viewAllLabel,
}: {
  title: string;
  products: ProductListItem[];
  locale: Locale;
  viewAllHref?: string;
  viewAllLabel?: string;
}) {
  if (!products.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <FadeIn>
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">{title}</h2>
          {viewAllHref ? (
            <Link href={viewAllHref} className="text-primary text-sm font-medium hover:underline">
              {viewAllLabel}
            </Link>
          ) : null}
        </div>
      </FadeIn>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
        {products.map((product, i) => (
          <FadeIn key={product.id} delay={(i * 60) / 1000}>
            <ProductCard slug={product.slug} data={product.data} locale={locale} />
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

export async function FeaturedProductsSection({
  products,
  locale,
}: {
  products: ProductListItem[];
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: "Home" });
  return (
    <ProductGridSection
      title={t("featuredTitle")}
      products={products}
      locale={locale}
      viewAllHref="/san-pham"
      viewAllLabel={t("featuredViewAll")}
    />
  );
}

export async function BestSellersSection({
  products,
  locale,
}: {
  products: ProductListItem[];
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: "Home" });
  return (
    <ProductGridSection
      title={t("bestSellersTitle")}
      products={products}
      locale={locale}
      viewAllHref="/san-pham?sort=best_selling"
      viewAllLabel={t("featuredViewAll")}
    />
  );
}
