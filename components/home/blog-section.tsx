import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getRecentPosts } from "@/lib/bakery/catalog";
import { t as tField } from "@/lib/i18n/text";
import type { Locale } from "@/lib/bakery/types";
import { formatDate } from "@/lib/utils/format";
import { FadeIn } from "@/components/motion/fade-in";
import { SectionHeading } from "./section-heading";

export async function BlogSection({ locale }: { locale: Locale }) {
  const [t, posts] = await Promise.all([
    getTranslations({ locale, namespace: "Home" }),
    getRecentPosts(3),
  ]);

  if (!posts.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <SectionHeading eyebrow={t("blogEyebrow")} title={t("blogTitle")} />
      <div className="grid gap-8 sm:grid-cols-3">
        {posts.map((post, i) => (
          <FadeIn key={post.id} delay={i * 0.08}>
            <Link href={`/tin-tuc/${post.slug}`} className="group block">
              <div className="bg-muted shadow-soft relative aspect-[4/3] overflow-hidden rounded-xl">
                {post.data.cover_url ? (
                  <Image
                    src={post.data.cover_url}
                    alt={tField(post.data.title, locale)}
                    fill
                    sizes="(min-width: 640px) 30vw, 90vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
              </div>
              <p className="text-muted-foreground mt-5 text-xs tracking-[0.15em] uppercase">
                {post.data.published_at ? formatDate(post.data.published_at, locale) : formatDate(post.created_at, locale)}
              </p>
              <h3 className="font-heading group-hover:text-brand-accent mt-2 line-clamp-2 text-xl transition-colors duration-300">
                {tField(post.data.title, locale)}
              </h3>
            </Link>
          </FadeIn>
        ))}
      </div>
      <div className="mt-14 text-center">
        <Link
          href="/tin-tuc"
          className="border-foreground/80 hover:bg-foreground hover:text-background inline-flex min-h-12 items-center border px-10 text-xs font-medium tracking-[0.2em] uppercase transition-colors duration-300"
        >
          {t("blogViewAll")}
        </Link>
      </div>
    </section>
  );
}
