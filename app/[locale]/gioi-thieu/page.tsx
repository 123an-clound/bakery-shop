import type { Metadata } from "next";

import { getPageBySlug } from "@/lib/bakery/catalog";
import { buildMetadata } from "@/lib/seo/metadata";
import type { Locale } from "@/lib/bakery/types";
import { t as tField } from "@/lib/i18n/text";
import { StaticPageContent } from "@/components/pages/static-page-content";

const SLUG = "gioi-thieu";

export async function generateMetadata({ params }: PageProps<"/[locale]/gioi-thieu">): Promise<Metadata> {
  const { locale } = await params;
  const page = await getPageBySlug(SLUG);
  if (!page) return {};
  return buildMetadata({
    title: tField(page.data.title, locale as Locale),
    ogImage: page.data.cover_url,
    path: `/${SLUG}`,
    locale: locale as Locale,
  });
}

export default async function AboutPage({ params }: PageProps<"/[locale]/gioi-thieu">) {
  const { locale } = await params;
  return <StaticPageContent slug={SLUG} locale={locale as Locale} />;
}
