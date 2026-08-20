import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import { getMyFavoriteProducts } from "@/lib/bakery/favorites";
import type { Locale } from "@/lib/bakery/types";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/tai-khoan/yeu-thich">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Favorites" });
  return { title: t("pageTitle"), robots: { index: false, follow: false } };
}

export default async function FavoritesPage({
  params,
}: PageProps<"/[locale]/tai-khoan/yeu-thich">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/tai-khoan/dang-nhap");

  const [t, products] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "Favorites" }),
    getMyFavoriteProducts(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold">{t("pageTitle")}</h1>

      {products.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
          <Button className="mt-6 rounded-full" asChild>
            <Link href="/san-pham">{t("browse")}</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              slug={product.slug}
              data={product.data}
              locale={locale as Locale}
              isFavorited
            />
          ))}
        </div>
      )}
    </div>
  );
}
