import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getCategories } from "@/lib/bakery/catalog";
import { t as tField } from "@/lib/i18n/text";
import type { Locale } from "@/lib/bakery/types";
import { FadeIn } from "@/components/motion/fade-in";
import { SectionHeading } from "./section-heading";

export async function CategoriesSection({ locale }: { locale: Locale }) {
  const [t, categories] = await Promise.all([
    getTranslations({ locale, namespace: "Home" }),
    getCategories(),
  ]);

  if (!categories.length) return null;

  return (
    <section className="bg-secondary/60 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={t("categoriesEyebrow")} title={t("categoriesTitle")} />
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category, i) => (
            <FadeIn key={category.id} delay={i * 0.06}>
              <Link
                href={`/danh-muc/${category.slug}`}
                className="group focus-visible:ring-ring flex flex-col items-center gap-4 rounded-xl p-3 text-center focus-visible:ring-2 focus-visible:outline-none"
              >
                <div className="bg-card shadow-soft group-hover:shadow-lift relative size-28 overflow-hidden rounded-full transition-shadow duration-500 sm:size-32">
                  {category.data.image_url ? (
                    <Image
                      src={category.data.image_url}
                      alt=""
                      fill
                      sizes="128px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <span className="font-heading group-hover:text-brand-accent text-base transition-colors duration-300">
                  {tField(category.data.name, locale)}
                </span>
              </Link>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
