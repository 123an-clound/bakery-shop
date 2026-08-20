import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { getSiteSettings } from "@/lib/bakery/queries";
import type { Locale } from "@/lib/bakery/types";
import { FadeIn } from "@/components/motion/fade-in";

/**
 * Placeholder image grid linking out to the shop's Instagram profile — muc
 * 8.1 point 10. No Instagram API integration is specified in the plan, so
 * this renders decorative placeholder tiles rather than a live feed. Off by
 * default in the seeded theme; admin enables it once real photos + a
 * profile URL are set.
 */
export async function InstagramSection({ locale }: { locale: Locale }) {
  const [t, settings] = await Promise.all([
    getTranslations({ locale, namespace: "Home" }),
    getSiteSettings(),
  ]);

  const profileUrl = settings?.data.socials?.instagram;
  if (!profileUrl) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <FadeIn>
        <h2 className="font-heading mb-8 text-2xl font-bold sm:text-3xl">{t("instagramTitle")}</h2>
      </FadeIn>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <a
            key={i}
            href={profileUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-muted focus-visible:ring-primary relative aspect-square overflow-hidden rounded-2xl transition-opacity hover:opacity-80 focus-visible:ring-4 focus-visible:outline-none"
          >
            <Image
              src={`https://picsum.photos/seed/instagram-${i}/400/400`}
              alt=""
              fill
              sizes="200px"
              className="object-cover"
            />
          </a>
        ))}
      </div>
    </section>
  );
}
