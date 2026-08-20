import type { Metadata } from "next";
import { Star } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getApprovedReviewsForProduct, getProductBySlug, getRelatedProducts } from "@/lib/bakery/catalog";
import { buildMetadata } from "@/lib/seo/metadata";
import type { Locale } from "@/lib/bakery/types";
import { t as tField } from "@/lib/i18n/text";
import { formatDate } from "@/lib/utils/format";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import { Link } from "@/i18n/navigation";
import { AddToCartControls } from "@/components/product/add-to-cart-controls";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductCard } from "@/components/product/product-card";
import { ReviewForm } from "@/components/product/review-form";
import { BreadcrumbJsonLd, ProductJsonLd } from "@/components/seo/json-ld";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FadeIn } from "@/components/motion/fade-in";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/san-pham/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return buildMetadata({
    title: tField(product.data.name, locale as Locale),
    description: product.data.short_description
      ? tField(product.data.short_description, locale as Locale)
      : undefined,
    ogImage: product.data.images[0],
    path: `/san-pham/${slug}`,
    locale: locale as Locale,
  });
}

export default async function ProductDetailPage({
  params,
}: PageProps<"/[locale]/san-pham/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [t, reviews, related] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "ProductDetail" }),
    getApprovedReviewsForProduct(product.id),
    product.parent_id ? getRelatedProducts(product.parent_id, product.id, 4) : Promise.resolve([]),
  ]);
  const name = tField(product.data.name, locale as Locale);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ProductJsonLd product={product.data} slug={slug} locale={locale as Locale} />
      <BreadcrumbJsonLd
        items={[
          { name: "Trang chủ", path: "/" },
          { name: "Thực đơn", path: "/san-pham" },
          { name, path: `/san-pham/${slug}` },
        ]}
      />

      <nav className="text-muted-foreground mb-6 flex gap-1.5 text-sm">
        <Link href="/san-pham" className="hover:text-primary">
          Thực đơn
        </Link>
        <span>/</span>
        <span className="text-foreground">{name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <FadeIn>
          <ProductGallery images={product.data.images} alt={name} />
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 className="font-heading text-3xl font-bold">{name}</h1>
          {product.data.rating_count > 0 ? (
            <div className="text-muted-foreground mt-2 flex items-center gap-1 text-sm">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={
                    i < Math.round(product.data.rating_avg) ? "fill-primary text-primary size-4" : "size-4"
                  }
                />
              ))}
              <span>
                {product.data.rating_avg.toFixed(1)} ({product.data.rating_count})
              </span>
            </div>
          ) : null}
          {product.data.short_description ? (
            <p className="text-muted-foreground mt-3">{tField(product.data.short_description, locale as Locale)}</p>
          ) : null}

          <div className="mt-6">
            <AddToCartControls data={product.data} locale={locale as Locale} />
          </div>
        </FadeIn>
      </div>

      <FadeIn className="mt-14">
        <Tabs defaultValue="description">
          <TabsList>
            <TabsTrigger value="description">{t("descriptionTab")}</TabsTrigger>
            <TabsTrigger value="ingredients">{t("ingredientsTab")}</TabsTrigger>
            <TabsTrigger value="shipping">{t("shippingTab")}</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="prose max-w-none py-4 text-sm leading-relaxed">
            {product.data.description ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(tField(product.data.description, locale as Locale)),
                }}
              />
            ) : null}
          </TabsContent>
          <TabsContent value="ingredients" className="space-y-2 py-4 text-sm leading-relaxed">
            {product.data.ingredients ? <p>{tField(product.data.ingredients, locale as Locale)}</p> : null}
            {product.data.allergens.length > 0 ? (
              <p>
                <strong>{t("allergensLabel")}:</strong> {product.data.allergens.join(", ")}
              </p>
            ) : null}
            <p>{t("prepTime", { hours: product.data.prep_time_hours })}</p>
            <p>{t("storageNote")}</p>
          </TabsContent>
          <TabsContent value="shipping" className="py-4 text-sm leading-relaxed">
            {t("shippingNote")}
          </TabsContent>
        </Tabs>
      </FadeIn>

      <FadeIn className="mt-14 max-w-2xl">
        <h2 className="font-heading mb-4 text-xl font-bold">{t("reviewsTitle")}</h2>
        <div className="mb-6 space-y-4">
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noReviews")}</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="border-border border-b pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={i < review.data.rating ? "fill-primary text-primary size-3.5" : "size-3.5"}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{review.data.author}</span>
                  <span className="text-muted-foreground text-xs">{formatDate(review.created_at, locale as Locale)}</span>
                </div>
                <p className="mt-1 text-sm">{review.data.content}</p>
              </div>
            ))
          )}
        </div>
        <ReviewForm productId={product.id} />
      </FadeIn>

      {related.length > 0 ? (
        <section className="mt-14">
          <h2 className="font-heading mb-6 text-xl font-bold">{t("relatedTitle")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} slug={p.slug} data={p.data} locale={locale as Locale} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
