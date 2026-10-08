import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { ProductListItem } from "@/lib/bakery/product-list";
import type { Locale } from "@/lib/bakery/types";
import { ProductCard } from "@/components/product/product-card";
import { FadeIn } from "@/components/motion/fade-in";
import { SectionHeading } from "./section-heading";

export function ProductGridSection({
  eyebrow,
  title,
  products,
  locale,
  viewAllHref,
  viewAllLabel,
  favoriteIds,
}: {
  eyebrow?: string;
  title: string;
  products: ProductListItem[];
  locale: Locale;
  viewAllHref?: string;
  viewAllLabel?: string;
  favoriteIds: Set<number>;
}) {
  if (!products.length) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <SectionHeading eyebrow={eyebrow} title={title} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 lg:gap-8">
        {products.map((product, i) => (
          <FadeIn key={product.id} delay={(i % 4) * 0.08} className="h-full">
            <ProductCard
              id={product.id}
              slug={product.slug}
              data={product.data}
              locale={locale}
              isFavorited={favoriteIds.has(product.id)}
            />
          </FadeIn>
        ))}
      </div>
      {viewAllHref ? (
        <div className="mt-14 text-center">
          <Link
            href={viewAllHref}
            className="border-foreground/80 hover:bg-foreground hover:text-background inline-flex min-h-12 items-center border px-10 text-xs font-medium tracking-[0.2em] uppercase transition-colors duration-300"
          >
            {viewAllLabel}
          </Link>
        </div>
      ) : null}
    </section>
  );
}

export async function FeaturedProductsSection({
  products,
  locale,
  favoriteIds,
}: {
  products: ProductListItem[];
  locale: Locale;
  favoriteIds: Set<number>;
}) {
  const t = await getTranslations({ locale, namespace: "Home" });
  return (
    <ProductGridSection
      eyebrow={t("featuredEyebrow")}
      title={t("featuredTitle")}
      products={products}
      locale={locale}
      viewAllHref="/san-pham"
      viewAllLabel={t("featuredViewAll")}
      favoriteIds={favoriteIds}
    />
  );
}

export async function BestSellersSection({
  products,
  locale,
  favoriteIds,
}: {
  products: ProductListItem[];
  locale: Locale;
  favoriteIds: Set<number>;
}) {
  const t = await getTranslations({ locale, namespace: "Home" });
  return (
    <ProductGridSection
      eyebrow={t("bestSellersEyebrow")}
      title={t("bestSellersTitle")}
      products={products}
      locale={locale}
      viewAllHref="/san-pham?sort=best_selling"
      viewAllLabel={t("featuredViewAll")}
      favoriteIds={favoriteIds}
    />
  );
}
