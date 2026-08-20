import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/bakery/types";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";

export async function CustomCakeSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "Home" });

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <FadeIn>
        <div className="bg-brand-accent text-brand-accent-foreground shadow-lift relative overflow-hidden rounded-4xl px-8 py-14 text-center sm:px-16">
          <div className="bg-primary/20 absolute -top-16 -right-16 size-64 rounded-full blur-3xl" />
          <h2 className="font-heading relative text-2xl font-bold sm:text-3xl">{t("customCakeTitle")}</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-sm opacity-90 sm:text-base">
            {t("customCakeSubtitle")}
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="text-foreground relative mt-6 rounded-full px-8"
            asChild
          >
            <Link href="/dat-banh-theo-yeu-cau">{t("customCakeCta")}</Link>
          </Button>
        </div>
      </FadeIn>
    </section>
  );
}
