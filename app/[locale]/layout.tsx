import type { Metadata } from "next";
import { Baloo_2, Be_Vietnam_Pro } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import "../globals.css";
import { routing } from "@/i18n/routing";
import { getSiteSettings, getTheme } from "@/lib/bakery/queries";
import { themeToCssVars } from "@/lib/theme/css-vars";
import { t } from "@/lib/i18n/text";
import type { Locale } from "@/lib/bakery/types";
import { LenisProvider } from "@/components/layout/lenis-provider";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Toaster } from "@/components/ui/sonner";

const baloo2 = Baloo_2({
  variable: "--font-heading",
  subsets: ["vietnamese", "latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: Omit<LayoutProps<"/[locale]">, "children">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Metadata" });
  return { title: t("title"), description: t("description") };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const [settingsRow, themeRow] = await Promise.all([getSiteSettings(), getTheme()]);
  const theme = themeRow?.data;
  const settings = settingsRow?.data;

  return (
    <html
      lang={locale}
      className={`${baloo2.variable} ${beVietnamPro.variable} h-full antialiased`}
      style={theme ? themeToCssVars(theme.colors, theme.radius) : undefined}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <LenisProvider enabled={theme?.effects.smooth_scroll ?? true}>
            {theme?.announcement_bar ? <AnnouncementBar config={theme.announcement_bar} /> : null}
            {settings ? (
              <Header brandName={t(settings.brand_name, locale as Locale)} logoUrl={settings.logo_url} />
            ) : null}
            <main className="flex flex-1 flex-col pb-16 lg:pb-0">{children}</main>
            {settings ? <Footer settings={settings} locale={locale as Locale} /> : null}
            <MobileNav />
          </LenisProvider>
        </NextIntlClientProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
