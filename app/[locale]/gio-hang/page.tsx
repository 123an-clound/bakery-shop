import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getSiteSettings } from "@/lib/bakery/queries";
import { buildMetadata } from "@/lib/seo/metadata";
import type { Locale } from "@/lib/bakery/types";
import { CartPageClient } from "@/components/cart/cart-page-client";

export async function generateMetadata({ params }: PageProps<"/[locale]/gio-hang">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Cart" });
  return buildMetadata({ title: t("title"), path: "/gio-hang", locale: locale as Locale });
}

export default async function CartPage({ params }: PageProps<"/[locale]/gio-hang">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const settingsRow = await getSiteSettings();
  const shipping = settingsRow?.data.shipping ?? { fee: 25000, free_from: 500000 };

  return <CartPageClient locale={locale as Locale} shippingFee={shipping.fee} freeFrom={shipping.free_from} />;
}
