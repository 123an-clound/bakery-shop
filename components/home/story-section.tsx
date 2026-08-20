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
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        {page.data.cover_url ? (
          <FadeIn>
            <div className="shadow-soft relative aspect-4/3 overflow-hidden rounded-4xl">
              <Image src={page.data.cover_url} alt="" fill className="object-cover" />
            </div>
          </FadeIn>
        ) : null}
        <FadeIn delay={0.1}>
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">{t("storyTitle")}</h2>
          <p className="text-muted-foreground mt-4 leading-relaxed">{excerpt}…</p>
          <Button variant="link" className="text-primary mt-1 px-0" asChild>
            <Link href="/gioi-thieu">{t("storyReadMore")} →</Link>
          </Button>

          <dl className="mt-8 grid grid-cols-3 gap-4">
            {STATS.map((stat) => (
              <div key={stat.key} className="text-center sm:text-left">
                <dt className="sr-only">{t(stat.key)}</dt>
                <dd className="font-heading text-primary text-2xl font-bold sm:text-3xl">
                  <CountUp value={stat.value} suffix={stat.suffix} />
                </dd>
                <p className="text-muted-foreground mt-1 text-xs sm:text-sm">{t(stat.key)}</p>
              </div>
            ))}
          </dl>
        </FadeIn>
      </div>
    </section>
  );
}
