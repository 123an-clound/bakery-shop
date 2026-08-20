import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { t as tField } from "@/lib/i18n/text";
import type { ThemeData } from "@/lib/bakery/schemas";
import type { Locale } from "@/lib/bakery/types";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { Tilt3D } from "@/components/motion/tilt-3d";
import { Marquee } from "@/components/motion/marquee";

export async function HeroSection({ hero, locale }: { hero: ThemeData["hero"]; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "Home" });

  return (
    <>
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div
          className="bg-primary/25 absolute -top-24 -left-24 size-96 rounded-full blur-3xl"
          style={{ animation: "var(--animate-blob)" }}
        />
        <div
          className="bg-secondary/40 absolute -right-24 -bottom-24 size-96 rounded-full blur-3xl"
          style={{ animation: "var(--animate-blob)", animationDelay: "3s" }}
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
          <FadeIn>
            <h1 className="font-heading text-foreground max-w-xl text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl">
              {tField(hero.title, locale) || t("heroTitleFallback")}
            </h1>
            {hero.subtitle ? (
              <p className="text-muted-foreground mt-4 max-w-md text-lg">{tField(hero.subtitle, locale)}</p>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-3">
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

          {hero.image_url ? (
            <Tilt3D className="shadow-lift mx-auto aspect-square w-full max-w-md rounded-4xl">
              <Image
                src={hero.image_url}
                alt=""
                width={640}
                height={640}
                priority
                className="size-full rounded-4xl object-cover"
              />
            </Tilt3D>
          ) : null}
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
