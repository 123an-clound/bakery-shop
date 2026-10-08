import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/bakery/types";
import { FadeIn } from "@/components/motion/fade-in";

export async function CustomCakeSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "Home" });

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <FadeIn>
        <div className="shadow-lift relative overflow-hidden rounded-xl bg-[#1a1a1a] px-8 py-20 text-center sm:px-16 lg:py-28">
          <Image
            src="https://images.unsplash.com/photo-1764269710986-0b69be00d7ca?auto=format&fit=crop&w=1800&q=75"
            alt=""
            fill
            sizes="(min-width: 1280px) 1216px, 100vw"
            className="object-cover opacity-35"
          />
          <p className="relative text-xs font-semibold tracking-[0.35em] text-[#e9cf7f] uppercase">{t("customCakeEyebrow")}</p>
          <h2 className="font-heading relative mt-4 text-3xl font-medium text-white sm:text-4xl lg:text-5xl">
            {t("customCakeTitle")}
          </h2>
          <p className="relative mx-auto mt-5 max-w-xl text-sm text-white/85 sm:text-base">{t("customCakeSubtitle")}</p>
          <Link
            href="/dat-banh-theo-yeu-cau"
            className="relative mt-10 inline-flex min-h-12 items-center border border-[#d4af37] px-10 text-xs font-medium tracking-[0.2em] text-[#e9cf7f] uppercase transition-colors duration-300 hover:bg-[#d4af37] hover:text-[#1a1a1a] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:outline-none"
          >
            {t("customCakeCta")}
          </Link>
        </div>
      </FadeIn>
    </section>
  );
}
