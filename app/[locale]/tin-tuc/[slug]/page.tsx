import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getRelatedPosts, getPostBySlug } from "@/lib/bakery/catalog";
import { buildMetadata } from "@/lib/seo/metadata";
import type { Locale } from "@/lib/bakery/types";
import { t as tField } from "@/lib/i18n/text";
import { formatDate } from "@/lib/utils/format";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import { Link } from "@/i18n/navigation";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { FadeIn } from "@/components/motion/fade-in";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/tin-tuc/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  const seo = post.data.seo;
  return buildMetadata({
    title: (seo?.title && tField(seo.title, locale as Locale)) || tField(post.data.title, locale as Locale),
    description:
      (seo?.description && tField(seo.description, locale as Locale)) ||
      (post.data.excerpt ? tField(post.data.excerpt, locale as Locale) : undefined),
    ogImage: post.data.cover_url,
    path: `/tin-tuc/${slug}`,
    locale: locale as Locale,
  });
}

export default async function BlogPostPage({ params }: PageProps<"/[locale]/tin-tuc/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);

  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [t, related] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "Blog" }),
    getRelatedPosts(post.id, 3),
  ]);

  const title = tField(post.data.title, locale as Locale);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <ArticleJsonLd
        title={title}
        description={post.data.excerpt ? tField(post.data.excerpt, locale as Locale) : undefined}
        imageUrl={post.data.cover_url}
        publishedAt={post.data.published_at ?? post.created_at}
        author={post.data.author}
        path={`/tin-tuc/${slug}`}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Trang chủ", path: "/" },
          { name: t("pageTitle"), path: "/tin-tuc" },
          { name: title, path: `/tin-tuc/${slug}` },
        ]}
      />

      <FadeIn>
        <p className="text-muted-foreground text-sm">
          {formatDate(post.data.published_at ?? post.created_at, locale as Locale)} · {post.data.author}
        </p>
        <h1 className="font-heading mt-2 text-3xl font-bold">{title}</h1>

        {post.data.cover_url ? (
          <div className="shadow-soft relative mt-6 aspect-video overflow-hidden rounded-4xl">
            <Image src={post.data.cover_url} alt={title} fill sizes="768px" className="object-cover" priority />
          </div>
        ) : null}

        {post.data.content ? (
          <div
            className="prose mt-8 max-w-none leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(tField(post.data.content, locale as Locale)) }}
          />
        ) : null}
      </FadeIn>

      {related.length > 0 ? (
        <section className="mt-14">
          <h2 className="font-heading mb-4 text-lg font-bold">{t("relatedTitle")}</h2>
          <ul className="space-y-2">
            {related.map((p) => (
              <li key={p.id}>
                <Link href={`/tin-tuc/${p.slug}`} className="text-brand-accent hover:underline">
                  {tField(p.data.title, locale as Locale)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
