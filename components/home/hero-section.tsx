import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { t as tField } from "@/lib/i18n/text";
import type { ThemeData } from "@/lib/bakery/schemas";
import type { Locale } from "@/lib/bakery/types";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { Marquee } from "@/components/motion/marquee";

export async function HeroSection({ hero, locale }: { hero: ThemeData["hero"]; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "Home" });

  return (
    <>
      <section className="relative flex min-h-[82dvh] items-center overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative mx-auto grid w-full max-w-7xl items-center lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,1.1fr)]">
          <div className="pointer-events-none absolute -inset-y-24 -left-[8vw] -z-10 hidden w-[52vw] opacity-75 [background:radial-gradient(circle_at_35%_50%,var(--background)_0%,color-mix(in_srgb,var(--background)_72%,transparent)_38%,transparent_72%)] lg:block" />
          <FadeIn>
            <div className="max-w-2xl text-center lg:text-left">
            <h1 className="font-heading text-foreground text-4xl leading-[1.06] font-semibold text-balance sm:text-5xl lg:text-7xl">
              {tField(hero.title, locale) || t("heroTitleFallback")}
            </h1>
            {hero.subtitle ? (
              <p className="text-muted-foreground mx-auto mt-5 max-w-md text-base leading-relaxed sm:text-lg lg:mx-0">
                {tField(hero.subtitle, locale)}
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Button size="lg" className="shadow-lift min-h-12 rounded-full px-8 transition-transform active:scale-[0.96]" asChild>
                <Link href={hero.cta?.href ?? "/san-pham"}>
                  {hero.cta ? tField(hero.cta.label, locale) : t("heroCtaFallback")}
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="min-h-12 rounded-full bg-background/75 px-8 backdrop-blur-sm transition-transform active:scale-[0.96]" asChild>
                <Link href="/san-pham">{t("viewMenu")}</Link>
              </Button>
            </div>
            </div>
          </FadeIn>
          <div aria-hidden="true" className="hidden min-h-[32rem] lg:block" />
        </div>
      </section>

      <div className="bg-secondary/50 border-border text-foreground border-y py-3">
        <Marquee className="text-sm font-medium">
          <span className="px-4">{t("marqueeFresh")}</span>
          <span className="px-4">•</span>
          <span className="px-4">{t("marqueeDelivery")}</span>
          <span className="px-4">•</span>
          <span className="px-4">{t("marqueeCustomCake")}</span>
          <span className="px-4">•</span>
        </Marquee>
      </div>
    </>
  );
}
