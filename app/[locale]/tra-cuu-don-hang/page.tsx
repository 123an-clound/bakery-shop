import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { buildMetadata } from "@/lib/seo/metadata";
import type { Locale } from "@/lib/bakery/types";
import { TrackOrderForm } from "@/components/orders/track-order-form";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/tra-cuu-don-hang">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "TrackOrder" });
  return buildMetadata({ title: t("pageTitle"), path: "/tra-cuu-don-hang", locale: locale as Locale });
}

export default async function TrackOrderPage({ params }: PageProps<"/[locale]/tra-cuu-don-hang">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations({ locale: locale as Locale, namespace: "TrackOrder" });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold">{t("pageTitle")}</h1>
      <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
      <div className="mt-8">
        <TrackOrderForm locale={locale as Locale} />
      </div>
    </div>
  );
}
