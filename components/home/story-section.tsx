import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getPageBySlug } from "@/lib/bakery/catalog";
import { t as tField } from "@/lib/i18n/text";
import type { Locale } from "@/lib/bakery/types";
import { stripHtml } from "@/lib/utils/sanitize";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { CountUp } from "@/components/motion/count-up";

const STATS = [
  { value: 5000, suffix: "+", key: "storyStatCakes" as const },
  { value: 5, suffix: "", key: "storyStatYears" as const },
  { value: 2000, suffix: "+", key: "storyStatCustomers" as const },
];

export async function StorySection({ locale }: { locale: Locale }) {
  const [t, page] = await Promise.all([
    getTranslations({ locale, namespace: "Home" }),
    getPageBySlug("gioi-thieu"),
  ]);

  if (!page) return null;

  const excerpt = stripHtml(tField(page.data.content, locale)).slice(0, 220);

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        {page.data.cover_url ? (
          <FadeIn>
            <div className="shadow-soft relative aspect-4/5 overflow-hidden rounded-xl">
              <Image src={page.data.cover_url} alt="" fill sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover" />
            </div>
          </FadeIn>
        ) : null}
        <FadeIn delay={0.1}>
          <p className="eyebrow">{t("storyEyebrow")}</p>
          <h2 className="font-heading mt-3 text-3xl font-medium sm:text-4xl lg:text-5xl">{t("storyTitle")}</h2>
          <p className="text-muted-foreground mt-6 text-base leading-relaxed sm:text-lg">{excerpt}…</p>
          <Button variant="link" className="mt-1 px-0" asChild>
            <Link href="/gioi-thieu">{t("storyReadMore")} →</Link>
          </Button>

          <dl className="border-border mt-10 grid grid-cols-3 gap-4 border-t pt-8">
            {STATS.map((stat) => (
              // axe "definition-list": a <dl> may only directly contain
              // dt/dd groups — flex-col-reverse keeps dt before dd in DOM
              // order (required) while still showing the number on top.
              <div key={stat.key} className="flex flex-col-reverse text-center sm:text-left">
                <dt className="text-muted-foreground mt-1 text-xs sm:text-sm">{t(stat.key)}</dt>
                <dd className="font-heading text-brand-accent text-3xl font-medium sm:text-4xl">
                  <CountUp value={stat.value} suffix={stat.suffix} />
                </dd>
              </div>
            ))}
          </dl>
        </FadeIn>
      </div>
    </section>
  );
}
