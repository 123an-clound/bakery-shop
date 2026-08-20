import type { Metadata } from "next";
import { MapPin, Phone } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getSiteSettings } from "@/lib/bakery/queries";
import { buildMetadata } from "@/lib/seo/metadata";
import type { Locale } from "@/lib/bakery/types";
import { t as tField } from "@/lib/i18n/text";
import { sanitizeMapEmbed } from "@/lib/utils/sanitize";
import { ContactForm } from "@/components/pages/contact-form";
import { FadeIn } from "@/components/motion/fade-in";

export async function generateMetadata({ params }: PageProps<"/[locale]/lien-he">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Contact" });
  return buildMetadata({ title: t("pageTitle"), path: "/lien-he", locale: locale as Locale });
}

export default async function ContactPage({ params }: PageProps<"/[locale]/lien-he">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const [t, settingsRow] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "Contact" }),
    getSiteSettings(),
  ]);
  const settings = settingsRow?.data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold">{t("pageTitle")}</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <FadeIn>
          <h2 className="font-heading mb-4 text-xl font-semibold">{t("infoTitle")}</h2>
          <div className="space-y-3 text-sm">
            {settings?.address ? (
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                {tField(settings.address, locale as Locale)}
              </p>
            ) : null}
            {settings?.hotline ? (
              <p className="flex items-center gap-2">
                <Phone className="size-4 shrink-0" />
                {settings.hotline}
              </p>
            ) : null}
            {settings?.email ? <p>{settings.email}</p> : null}
            {settings?.opening_hours ? <p>{tField(settings.opening_hours, locale as Locale)}</p> : null}
          </div>

          {settings?.map_embed ? (
            <div
              className="shadow-soft mt-6 overflow-hidden rounded-3xl [&_iframe]:h-72 [&_iframe]:w-full"
              dangerouslySetInnerHTML={{ __html: sanitizeMapEmbed(settings.map_embed) }}
            />
          ) : null}
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2 className="font-heading mb-4 text-xl font-semibold">{t("formTitle")}</h2>
          <ContactForm />
        </FadeIn>
      </div>
    </div>
  );
}
