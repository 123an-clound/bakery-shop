import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getCategories, getCategoryBySlug, listProducts } from "@/lib/bakery/catalog";
import { buildMetadata } from "@/lib/seo/metadata";
import type { Locale } from "@/lib/bakery/types";
import type { ProductSort } from "@/lib/bakery/product-list";
import { t as tField } from "@/lib/i18n/text";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/product/product-card";
import { ProductsFilters } from "@/components/product/products-filters";
import { ProductsPagination } from "@/components/product/products-pagination";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";

const SORT_VALUES: ProductSort[] = ["newest", "price_asc", "price_desc", "best_selling", "rating"];

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/danh-muc/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return buildMetadata({
    title: tField(category.data.name, locale as Locale),
    description: category.data.description ? tField(category.data.description, locale as Locale) : undefined,
    ogImage: category.data.image_url,
    path: `/danh-muc/${slug}`,
    locale: locale as Locale,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<"/[locale]/danh-muc/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);
  const sp = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const asString = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const min = asString(sp.min);
  const max = asString(sp.max);
  const sortParam = asString(sp.sort);
  const sort = SORT_VALUES.includes(sortParam as ProductSort) ? (sortParam as ProductSort) : "newest";
  const page = Number(asString(sp.page)) || 1;

  const [t, tCategory, categories, result] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "Products" }),
    getTranslations({ locale: locale as Locale, namespace: "Category" }),
    getCategories(),
    listProducts({
      categorySlug: slug,
      minPrice: min ? Number(min) : undefined,
      maxPrice: max ? Number(max) : undefined,
      sort,
      page,
      perPage: 12,
    }),
  ]);

  const name = tField(category.data.name, locale as Locale);
  const currentParams: Record<string, string | undefined> = { min, max, sort: sortParam, page: String(page) };
  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (min) params.set("min", min);
    if (max) params.set("max", max);
    if (sortParam) params.set("sort", sortParam);
    if (p > 1) params.set("page", String(p));
    const query = params.toString();
    return query ? `/danh-muc/${slug}?${query}` : `/danh-muc/${slug}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <BreadcrumbJsonLd
        items={[
          { name: "Trang chủ", path: "/" },
          { name: "Thực đơn", path: "/san-pham" },
          { name, path: `/danh-muc/${slug}` },
        ]}
      />

      <Button variant="link" className="text-primary mb-2 px-0" asChild>
        <Link href="/san-pham">← {tCategory("backToAll")}</Link>
      </Button>
      <h1 className="font-heading text-3xl font-bold">{name}</h1>
      {category.data.description ? (
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
          {tField(category.data.description, locale as Locale)}
        </p>
      ) : null}
      <p className="text-muted-foreground mt-1 text-sm">{t("resultsCount", { count: result.total })}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <ProductsFilters
          categories={categories}
          activeCategorySlug={slug}
          currentParams={currentParams}
          locale={locale as Locale}
        />

        <div>
          {result.items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-heading text-lg font-semibold">{t("emptyTitle")}</p>
              <p className="text-muted-foreground mt-1 text-sm">{t("emptySubtitle")}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
                {result.items.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    slug={product.slug}
                    data={product.data}
                    locale={locale as Locale}
                    priority={i < 6}
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
