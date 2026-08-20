import type { Metadata } from "next";

import { getPageBySlug } from "@/lib/bakery/catalog";
import { buildMetadata } from "@/lib/seo/metadata";
import type { Locale } from "@/lib/bakery/types";
import { t as tField } from "@/lib/i18n/text";
import { StaticPageContent } from "@/components/pages/static-page-content";

const SLUG = "dieu-khoan";

export async function generateMetadata({ params }: PageProps<"/[locale]/dieu-khoan">): Promise<Metadata> {
  const { locale } = await params;
  const page = await getPageBySlug(SLUG);
  if (!page) return {};
  return buildMetadata({
    title: tField(page.data.title, locale as Locale),
    path: `/${SLUG}`,
    locale: locale as Locale,
  });
}

export default async function TermsPage({ params }: PageProps<"/[locale]/dieu-khoan">) {
  const { locale } = await params;
  return <StaticPageContent slug={SLUG} locale={locale as Locale} />;
}
