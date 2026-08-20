import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getSiteSettings } from "@/lib/bakery/queries";
import { buildMetadata } from "@/lib/seo/metadata";
import type { Locale } from "@/lib/bakery/types";
import { CheckoutPageClient } from "@/components/checkout/checkout-page-client";

export async function generateMetadata({ params }: PageProps<"/[locale]/thanh-toan">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Checkout" });
  return buildMetadata({ title: t("pageTitle"), path: "/thanh-toan", locale: locale as Locale });
}

export default async function CheckoutPage({ params }: PageProps<"/[locale]/thanh-toan">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const settingsRow = await getSiteSettings();
  const shipping = settingsRow?.data.shipping ?? { fee: 25000, free_from: 500000 };

  return (
    <CheckoutPageClient locale={locale as Locale} shippingFee={shipping.fee} freeFrom={shipping.free_from} />
  );
}
