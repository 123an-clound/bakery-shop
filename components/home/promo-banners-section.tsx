import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getActiveBanners } from "@/lib/bakery/catalog";
import { t as tField } from "@/lib/i18n/text";
import type { Locale } from "@/lib/bakery/types";
import { FadeIn } from "@/components/motion/fade-in";

/** Admin-managed promo slides (mục 9.7) — hidden entirely when none are live. */
export async function PromoBannersSection({ locale }: { locale: Locale }) {
  const [t, banners] = await Promise.all([getTranslations({ locale, namespace: "Home" }), getActiveBanners()]);
  if (!banners.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="promo-title">
      <h2 id="promo-title" className="font-heading mb-6 text-2xl font-bold sm:text-3xl">
        {t("promoTitle")}
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map((banner, i) => {
          const title = banner.data.title ? tField(banner.data.title, locale) : "";
          const subtitle = banner.data.subtitle ? tField(banner.data.subtitle, locale) : "";
          const cta = banner.data.cta_label ? tField(banner.data.cta_label, locale) : "";
          const href = banner.data.href ?? "";

          const card = (
            <div className="bg-muted shadow-soft group relative aspect-[4/3] overflow-hidden rounded-3xl">
              <Image
                src={banner.data.image_url}
                alt={title}
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                className={`object-cover transition-transform duration-300 group-hover:scale-105 ${banner.data.image_mobile_url ? "hidden sm:block" : ""}`}
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
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5 text-white">
                  {title ? <p className="font-heading text-lg font-bold">{title}</p> : null}
                  {subtitle ? <p className="mt-1 text-sm opacity-90">{subtitle}</p> : null}
                  {cta && href ? <span className="mt-3 inline-block text-sm font-semibold underline">{cta}</span> : null}
                </div>
              ) : null}
            </div>
          );

          return (
            <FadeIn key={banner.id} delay={(i * 60) / 1000}>
              {href.startsWith("/") ? (
                <Link href={href} className="block">
                  {card}
                </Link>
              ) : /^https?:\/\//.test(href) ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className="block">
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
