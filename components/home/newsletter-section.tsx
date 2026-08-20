"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/motion/fade-in";

/**
 * No `newsletter_subscriber` shape exists in the 15 bakery `type`s (muc 4.2),
 * and the plan explicitly allows skipping persistence for this section (muc
 * 8.1 point 11: "luu vao type='customer' hoac bo qua neu chua can"). Rather
 * than fake a "you're subscribed" success, this is honest about the feature
 * not being wired up yet.
 */
export function NewsletterSection() {
  const t = useTranslations("Home");

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <FadeIn>
        <h2 className="font-heading text-2xl font-bold sm:text-3xl">{t("newsletterTitle")}</h2>
        <p className="text-muted-foreground mt-2">{t("newsletterSubtitle")}</p>
        <form
          className="mx-auto mt-6 flex max-w-md gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            toast.info(t("newsletterComingSoon"));
          }}
        >
          <Input
            type="email"
            required
            placeholder={t("newsletterPlaceholder")}
            className="rounded-full"
            aria-label={t("newsletterPlaceholder")}
          />
          <Button type="submit" className="shrink-0 rounded-full px-6">
            {t("newsletterSubmit")}
          </Button>
        </form>
      </FadeIn>
    </section>
  );
}
