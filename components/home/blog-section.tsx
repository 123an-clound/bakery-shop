import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getRecentPosts } from "@/lib/bakery/catalog";
import { t as tField } from "@/lib/i18n/text";
import type { Locale } from "@/lib/bakery/types";
import { formatDate } from "@/lib/utils/format";
import { FadeIn } from "@/components/motion/fade-in";

export async function BlogSection({ locale }: { locale: Locale }) {
  const [t, posts] = await Promise.all([
    getTranslations({ locale, namespace: "Home" }),
    getRecentPosts(3),
  ]);

  if (!posts.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <FadeIn>
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">{t("blogTitle")}</h2>
          <Link href="/tin-tuc" className="text-brand-accent text-sm font-medium hover:underline">
            {t("blogViewAll")}
          </Link>
        </div>
      </FadeIn>
      <div className="grid gap-6 sm:grid-cols-3">
        {posts.map((post, i) => (
          <FadeIn key={post.id} delay={(i * 60) / 1000}>
            <Link href={`/tin-tuc/${post.slug}`} className="group block">
              <div className="bg-muted shadow-soft relative aspect-video overflow-hidden rounded-3xl">
                {post.data.cover_url ? (
                  <Image
                    src={post.data.cover_url}
                    alt={tField(post.data.title, locale)}
                    fill
                    sizes="(min-width: 640px) 30vw, 90vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : null}
              </div>
              <p className="text-muted-foreground mt-3 text-xs">
                {post.data.published_at ? formatDate(post.data.published_at, locale) : formatDate(post.created_at, locale)}
              </p>
              <h3 className="group-hover:text-brand-accent mt-1 line-clamp-2 font-semibold transition-colors">
                {tField(post.data.title, locale)}
              </h3>
            </Link>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
