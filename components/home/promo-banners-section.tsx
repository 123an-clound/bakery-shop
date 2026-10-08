import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getActiveBanners } from "@/lib/bakery/catalog";
import { t as tField } from "@/lib/i18n/text";
import type { Locale } from "@/lib/bakery/types";
import { FadeIn } from "@/components/motion/fade-in";
import { SectionHeading } from "./section-heading";

/** Admin-managed promo slides (mục 9.7) — hidden entirely when none are live. */
export async function PromoBannersSection({ locale }: { locale: Locale }) {
  const [t, banners] = await Promise.all([getTranslations({ locale, namespace: "Home" }), getActiveBanners()]);
  if (!banners.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28" aria-labelledby="promo-title">
      <SectionHeading id="promo-title" eyebrow={t("promoEyebrow")} title={t("promoTitle")} />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {banners.map((banner, i) => {
          const title = banner.data.title ? tField(banner.data.title, locale) : "";
          const subtitle = banner.data.subtitle ? tField(banner.data.subtitle, locale) : "";
          const cta = banner.data.cta_label ? tField(banner.data.cta_label, locale) : "";
          const href = banner.data.href ?? "";

          const card = (
            <div className="bg-muted shadow-soft group relative aspect-[4/5] overflow-hidden rounded-xl">
              <Image
                src={banner.data.image_url}
                alt={title}
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                className={`object-cover transition-transform duration-500 group-hover:scale-105 ${banner.data.image_mobile_url ? "hidden sm:block" : ""}`}
              />
              {banner.data.image_mobile_url ? (
                <Image
                  src={banner.data.image_mobile_url}
                  alt={title}
                  fill
                  sizes="90vw"
                  className="object-cover sm:hidden"
                />
              ) : null}
              {title || subtitle || cta ? (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 pt-20 text-white">
                  {title ? <p className="font-heading text-2xl font-medium">{title}</p> : null}
                  {subtitle ? <p className="mt-2 text-sm text-white/85">{subtitle}</p> : null}
                  {cta && href ? (
                    <span className="mt-4 inline-block border-b border-[#d4af37] pb-1 text-xs font-semibold tracking-[0.2em] text-[#e9cf7f] uppercase">
                      {cta}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          );

          return (
            <FadeIn key={banner.id} delay={i * 0.08}>
              {href.startsWith("/") ? (
                <Link href={href} className="block rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                  {card}
                </Link>
              ) : /^https?:\/\//.test(href) ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {card}
                </a>
              ) : (
                card
              )}
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
}
