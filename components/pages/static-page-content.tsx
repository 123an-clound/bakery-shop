import { notFound } from "next/navigation";
import Image from "next/image";

import { getPageBySlug } from "@/lib/bakery/catalog";
import type { Locale } from "@/lib/bakery/types";
import { t as tField } from "@/lib/i18n/text";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import { FadeIn } from "@/components/motion/fade-in";

export async function StaticPageContent({ slug, locale }: { slug: string; locale: Locale }) {
  const page = await getPageBySlug(slug);
  if (!page) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <FadeIn>
        <h1 className="font-heading text-3xl font-bold">{tField(page.data.title, locale)}</h1>
        {page.data.cover_url ? (
          <div className="shadow-soft relative mt-6 aspect-video overflow-hidden rounded-4xl">
            <Image
              src={page.data.cover_url}
              alt={tField(page.data.title, locale)}
              fill
              sizes="768px"
              className="object-cover"
              priority
            />
          </div>
        ) : null}
        {page.data.content ? (
          <div
            className="prose mt-8 max-w-none leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(tField(page.data.content, locale)) }}
          />
        ) : null}
      </FadeIn>
    </article>
  );
}
