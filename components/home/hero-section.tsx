import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { t as tField } from "@/lib/i18n/text";
import type { ThemeData } from "@/lib/bakery/schemas";
import type { Locale } from "@/lib/bakery/types";
import { FadeIn } from "@/components/motion/fade-in";
import { Marquee } from "@/components/motion/marquee";

export async function HeroSection({ hero, locale }: { hero: ThemeData["hero"]; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "Home" });

  return (
    <>
      {/* -mt-18 slides the hero under the sticky (initially transparent) header. */}
      <section className="relative -mt-18 flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#1a1a1a] px-4 text-center sm:px-6">
        {hero.image_url ? (
          <Image
            src={hero.image_url}
            alt=""
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/70" />

        <FadeIn className="relative z-10 mx-auto max-w-4xl pt-18">
          <p className="text-[#e9cf7f] text-xs font-semibold tracking-[0.35em] uppercase sm:text-sm">{t("heroEyebrow")}</p>
          <h1 className="font-heading mt-6 text-5xl leading-[1.05] font-medium text-balance text-white sm:text-6xl lg:text-7xl">
            {tField(hero.title, locale) || t("heroTitleFallback")}
          </h1>
          {hero.subtitle ? (
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
              {tField(hero.subtitle, locale)}
            </p>
          ) : null}
          <Link
            href={hero.cta?.href ?? "/san-pham"}
            className="mt-10 inline-flex min-h-12 items-center justify-center border border-[#d4af37] px-10 text-sm font-medium tracking-[0.2em] text-[#e9cf7f] uppercase transition-colors duration-300 hover:bg-[#d4af37] hover:text-[#1a1a1a] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-4 focus-visible:ring-offset-black focus-visible:outline-none"
          >
            {hero.cta ? tField(hero.cta.label, locale) : t("viewMenu")}
          </Link>
        </FadeIn>
      </section>

      <div className="bg-secondary text-secondary-foreground border-border border-b py-4">
        <Marquee className="text-xs font-medium tracking-[0.25em] uppercase">
          <span className="px-6">{t("marqueeFresh")}</span>
          <span className="text-brand-accent px-6">✦</span>
          <span className="px-6">{t("marqueeDelivery")}</span>
          <span className="text-brand-accent px-6">✦</span>
          <span className="px-6">{t("marqueeCustomCake")}</span>
          <span className="text-brand-accent px-6">✦</span>
        </Marquee>
      </div>
    </>
  );
}
