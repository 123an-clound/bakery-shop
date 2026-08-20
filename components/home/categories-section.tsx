import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getCategories } from "@/lib/bakery/catalog";
import { t as tField } from "@/lib/i18n/text";
import type { Locale } from "@/lib/bakery/types";
import { FadeIn } from "@/components/motion/fade-in";

export async function CategoriesSection({ locale }: { locale: Locale }) {
  const [t, categories] = await Promise.all([
    getTranslations({ locale, namespace: "Home" }),
    getCategories(),
  ]);

  if (!categories.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <FadeIn>
        <h2 className="font-heading mb-8 text-2xl font-bold sm:text-3xl">{t("categoriesTitle")}</h2>
      </FadeIn>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((category, i) => (
          <FadeIn key={category.id} delay={(i * 60) / 1000}>
            <Link
              href={`/danh-muc/${category.slug}`}
              className="group focus-visible:ring-primary flex flex-col items-center gap-2 rounded-3xl p-3 text-center transition-transform hover:-translate-y-1 focus-visible:ring-4 focus-visible:outline-none"
            >
              <div className="bg-secondary/50 shadow-soft relative size-20 overflow-hidden rounded-full sm:size-24">
                {category.data.image_url ? (
                  <Image
                    src={category.data.image_url}
                    alt={tField(category.data.name, locale)}
                    fill
                    sizes="96px"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : null}
              </div>
              <span className="text-sm font-medium">{tField(category.data.name, locale)}</span>
            </Link>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
