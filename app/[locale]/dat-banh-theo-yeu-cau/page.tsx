import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { buildMetadata } from "@/lib/seo/metadata";
import type { Locale } from "@/lib/bakery/types";
import { CustomCakeWizard } from "@/components/custom-cake/custom-cake-wizard";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dat-banh-theo-yeu-cau">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "CustomCake" });
  return buildMetadata({
    title: t("pageTitle"),
    description: t("pageSubtitle"),
    path: "/dat-banh-theo-yeu-cau",
    locale: locale as Locale,
  });
}

export default async function CustomCakePage({
  params,
}: PageProps<"/[locale]/dat-banh-theo-yeu-cau">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations({ locale: locale as Locale, namespace: "CustomCake" });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold">{t("pageTitle")}</h1>
      <p className="text-muted-foreground mt-2">{t("pageSubtitle")}</p>
      <div className="mt-8">
        <CustomCakeWizard />
      </div>
    </div>
  );
}
