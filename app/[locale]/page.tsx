import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { getSiteSettings, getTheme } from "@/lib/bakery/queries";
import type { Locale } from "@/lib/bakery/types";
import { HomeSections } from "@/components/home/home-sections";
import { LocalBusinessJsonLd } from "@/components/seo/json-ld";

// Home page's <title>/<meta description> come from the layout's default
// (settings.seo, see generateMetadata in layout.tsx) — only hreflang
// alternates are page-specific here.
export function generateMetadata(): Metadata {
  return {
    alternates: { canonical: "/", languages: { vi: "/", en: "/en" } },
  };
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const [themeRow, settingsRow] = await Promise.all([getTheme(), getSiteSettings()]);

  if (!themeRow) {
    return null;
  }

  return (
    <div className="flex flex-col">
      {settingsRow ? <LocalBusinessJsonLd settings={settingsRow.data} locale={locale as Locale} /> : null}
      <HomeSections theme={themeRow.data} locale={locale as Locale} />
    </div>
  );
}
