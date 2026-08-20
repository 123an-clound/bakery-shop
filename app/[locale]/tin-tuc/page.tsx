import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getAllPosts } from "@/lib/bakery/catalog";
import { buildMetadata } from "@/lib/seo/metadata";
import type { Locale } from "@/lib/bakery/types";
import { t as tField } from "@/lib/i18n/text";
import { formatDate } from "@/lib/utils/format";
import { Link } from "@/i18n/navigation";
import { FadeIn } from "@/components/motion/fade-in";

export async function generateMetadata({ params }: PageProps<"/[locale]/tin-tuc">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Blog" });
  return buildMetadata({ title: t("pageTitle"), path: "/tin-tuc", locale: locale as Locale });
}

export default async function BlogListPage({ params }: PageProps<"/[locale]/tin-tuc">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const [t, posts] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "Blog" }),
    getAllPosts(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold">{t("pageTitle")}</h1>

      {posts.length === 0 ? (
        <p className="text-muted-foreground mt-6 text-sm">{t("empty")}</p>
      ) : (
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          {posts.map((post, i) => (
            <FadeIn key={post.id} delay={(i * 60) / 1000}>
              <Link href={`/tin-tuc/${post.slug}`} className="group block">
                <div className="bg-muted shadow-soft relative aspect-video overflow-hidden rounded-3xl">
                  {post.data.cover_url ? (
                    <Image
                      src={post.data.cover_url}
                      alt={tField(post.data.title, locale as Locale)}
                      fill
                      priority={i < 2}
                      sizes="(min-width: 640px) 45vw, 90vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <p className="text-muted-foreground mt-3 text-xs">
                  {formatDate(post.data.published_at ?? post.created_at, locale as Locale)}
                </p>
                <h2 className="group-hover:text-primary mt-1 text-lg font-semibold transition-colors">
                  {tField(post.data.title, locale as Locale)}
                </h2>
                {post.data.excerpt ? (
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                    {tField(post.data.excerpt, locale as Locale)}
                  </p>
                ) : null}
              </Link>
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  );
}
