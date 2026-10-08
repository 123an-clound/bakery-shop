import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getFeaturedTestimonials } from "@/lib/bakery/catalog";
import type { Locale } from "@/lib/bakery/types";
import { FadeIn } from "@/components/motion/fade-in";
import { SectionHeading } from "./section-heading";

export async function TestimonialsSection({ locale }: { locale: Locale }) {
  const [t, testimonials] = await Promise.all([
    getTranslations({ locale, namespace: "Home" }),
    getFeaturedTestimonials(6),
  ]);

  if (!testimonials.length) return null;

  return (
    <section className="bg-secondary/60 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={t("testimonialsEyebrow")} title={t("testimonialsTitle")} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {testimonials.map((review, i) => (
            <FadeIn key={review.id} delay={(i % 3) * 0.08} className="h-full">
              <figure className="bg-card shadow-soft h-full rounded-xl p-8">
                <div className="mb-2 flex gap-0.5">
                  {Array.from({ length: 5 }, (_, star) => (
                    <Star
                      key={star}
                      className={
                        star < review.rating ? "fill-primary text-primary size-4" : "text-muted size-4"
                      }
                    />
                  ))}
                </div>
                <blockquote className="font-heading text-lg leading-relaxed italic">&ldquo;{review.content}&rdquo;</blockquote>
                <figcaption className="text-muted-foreground mt-6 text-xs font-medium tracking-[0.15em] uppercase">
                  {review.author}
                  {review.productName ? ` · ${review.productName}` : ""}
                </figcaption>
              </figure>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
