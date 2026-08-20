import type { Metadata } from "next";
import { Baloo_2, Be_Vietnam_Pro, Quicksand, Nunito, Lora, Playfair_Display } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import "../globals.css";
import { routing } from "@/i18n/routing";
import { getSiteSettings, getTheme } from "@/lib/bakery/queries";
import { createClient } from "@/lib/supabase/server";
import { themeToCssVars } from "@/lib/theme/css-vars";
import { t as tField } from "@/lib/i18n/text";
import type { Locale } from "@/lib/bakery/types";
import { LenisProvider } from "@/components/layout/lenis-provider";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CartHydration } from "@/components/cart/cart-hydration";
import { ThemePreviewListener } from "@/components/theme/theme-preview-listener";
import { Toaster } from "@/components/ui/sonner";

// Every Theme Editor font choice (mục 9.6) loads statically here, each under
// its own `--font-<slug>` variable (see lib/theme/fonts.ts) — switching the
// admin's heading/body pick only ever re-selects which variable
// `--font-heading`/`--font-body` aliases (lib/theme/css-vars.ts), never
// changes what's fetched at build time. Next.js self-hosts all 6 but a
// browser only downloads the @font-face actually referenced by rendered
// text, so an unpicked font never costs a real request.
const baloo2 = Baloo_2({
  variable: "--font-baloo-2",
  subsets: ["vietnamese", "latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});
const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});
const lora = Lora({
  variable: "--font-lora",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["vietnamese", "latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});
const THEME_FONT_VARIABLES = [baloo2, beVietnamPro, quicksand, nunito, lora, playfairDisplay]
  .map((f) => f.variable)
  .join(" ");

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: Omit<LayoutProps<"/[locale]">, "children">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const [t, settingsRow] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "Metadata" }),
    getSiteSettings(),
  ]);
  const seo = settingsRow?.data.seo;
  const brandName = settingsRow ? tField(settingsRow.data.brand_name, locale as Locale) : undefined;

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: {
      default: (seo?.title && tField(seo.title, locale as Locale)) || t("title"),
      template: brandName ? `%s | ${brandName}` : "%s",
    },
    description: (seo?.description && tField(seo.description, locale as Locale)) || t("description"),
    openGraph: { images: seo?.og_image ? [{ url: seo.og_image }] : undefined },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const supabase = await createClient();
  const [settingsRow, themeRow, userResult] = await Promise.all([
    getSiteSettings(),
    getTheme(),
    supabase.auth.getUser(),
  ]);
  const theme = themeRow?.data;
  const settings = settingsRow?.data;
  const userEmail = userResult.data.user?.email ?? null;

  return (
    <html
      lang={locale}
      className={`${THEME_FONT_VARIABLES} h-full antialiased`}
      style={theme ? themeToCssVars(theme.colors, theme.radius, theme.fonts) : undefined}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <LenisProvider enabled={theme?.effects.smooth_scroll ?? true}>
            {theme?.announcement_bar ? <AnnouncementBar config={theme.announcement_bar} /> : null}
            {settings ? (
              <Header
                brandName={tField(settings.brand_name, locale as Locale)}
                logoUrl={settings.logo_url}
                locale={locale as Locale}
                userEmail={userEmail}
              />
            ) : null}
            <main className="flex flex-1 flex-col pb-16 lg:pb-0">{children}</main>
            {settings ? <Footer settings={settings} locale={locale as Locale} /> : null}
            <MobileNav />
          </LenisProvider>
        </NextIntlClientProvider>
        <Toaster richColors position="top-center" />
        <CartHydration />
        <ThemePreviewListener />
      </body>
    </html>
  );
}
