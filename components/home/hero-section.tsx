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
      <section className="relative flex min-h-[80vh] items-center overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-3xl text-center">
          <FadeIn>
            <h1 className="font-heading text-foreground text-4xl leading-tight font-semibold sm:text-5xl lg:text-6xl">
              {tField(hero.title, locale) || t("heroTitleFallback")}
            </h1>
            {hero.subtitle ? (
              <p className="text-muted-foreground mx-auto mt-4 max-w-md text-lg">{tField(hero.subtitle, locale)}</p>
            ) : null}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" className="shadow-lift rounded-full px-8 active:scale-[0.96]" asChild>
                <Link href={hero.cta?.href ?? "/san-pham"}>
                  {hero.cta ? tField(hero.cta.label, locale) : t("heroCtaFallback")}
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8" asChild>
                <Link href="/san-pham">{t("viewMenu")}</Link>
              </Button>
            </div>
          </FadeIn>
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
