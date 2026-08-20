import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getFeaturedTestimonials } from "@/lib/bakery/catalog";
import type { Locale } from "@/lib/bakery/types";
import { FadeIn } from "@/components/motion/fade-in";

export async function TestimonialsSection({ locale }: { locale: Locale }) {
  const [t, testimonials] = await Promise.all([
    getTranslations({ locale, namespace: "Home" }),
    getFeaturedTestimonials(6),
  ]);

  if (!testimonials.length) return null;

  return (
    <section className="bg-secondary/30 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <h2 className="font-heading mb-8 text-2xl font-bold sm:text-3xl">{t("testimonialsTitle")}</h2>
        </FadeIn>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((review, i) => (
            <FadeIn key={review.id} delay={(i * 60) / 1000}>
              <figure className="bg-card shadow-soft h-full rounded-3xl p-6">
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
                <blockquote className="text-sm leading-relaxed">&ldquo;{review.content}&rdquo;</blockquote>
                <figcaption className="text-muted-foreground mt-4 text-xs font-medium">
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
