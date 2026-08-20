import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getCategories, listProducts } from "@/lib/bakery/catalog";
import { getMyFavoriteProductIds } from "@/lib/bakery/favorites";
import { buildMetadata } from "@/lib/seo/metadata";
import type { Locale } from "@/lib/bakery/types";
import type { ProductSort } from "@/lib/bakery/product-list";
import { ProductCard } from "@/components/product/product-card";
import { ProductsFilters } from "@/components/product/products-filters";
import { ProductsPagination } from "@/components/product/products-pagination";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const SORT_VALUES: ProductSort[] = ["newest", "price_asc", "price_desc", "best_selling", "rating"];

export async function generateMetadata({ params }: PageProps<"/[locale]/san-pham">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Products" });
  return buildMetadata({ title: t("pageTitle"), path: "/san-pham", locale: locale as Locale });
}

export default async function ProductsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/san-pham">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const sp = await searchParams;

  const asString = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const q = asString(sp.q);
  const min = asString(sp.min);
  const max = asString(sp.max);
  const sortParam = asString(sp.sort);
  const sort = SORT_VALUES.includes(sortParam as ProductSort) ? (sortParam as ProductSort) : "newest";
  const page = Number(asString(sp.page)) || 1;

  const [t, categories, result, favoriteIds] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "Products" }),
    getCategories(),
    listProducts({
      search: q,
      minPrice: min ? Number(min) : undefined,
      maxPrice: max ? Number(max) : undefined,
      sort,
      page,
      perPage: 12,
    }),
    getMyFavoriteProductIds(),
  ]);
  const favoriteIdSet = new Set(favoriteIds);

  const currentParams: Record<string, string | undefined> = { q, min, max, sort: sortParam, page: String(page) };
  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (min) params.set("min", min);
    if (max) params.set("max", max);
    if (sortParam) params.set("sort", sortParam);
    if (p > 1) params.set("page", String(p));
    const query = params.toString();
    return query ? `/san-pham?${query}` : "/san-pham";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold">{t("pageTitle")}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{t("resultsCount", { count: result.total })}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <ProductsFilters categories={categories} currentParams={currentParams} locale={locale as Locale} />

        <div>
          {result.items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-heading text-lg font-semibold">{t("emptyTitle")}</p>
              <p className="text-muted-foreground mt-1 text-sm">{t("emptySubtitle")}</p>
              <Button variant="outline" className="mt-4 rounded-full" asChild>
                <Link href="/san-pham">{t("clearFilters")}</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
                {result.items.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    slug={product.slug}
                    data={product.data}
                    locale={locale as Locale}
                    priority={i < 6}
                    isFavorited={favoriteIdSet.has(product.id)}
                  />
                ))}
              </div>
              <ProductsPagination page={result.page} pageCount={result.pageCount} buildHref={buildHref} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

