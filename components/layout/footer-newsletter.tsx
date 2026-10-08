"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

/** No subscriber storage exists yet (see NewsletterSection) — be honest instead of faking success. */
export function FooterNewsletter() {
  const t = useTranslations("Footer");

  return (
    <form
      className="mt-5 flex border-b border-white/30 focus-within:border-[#d4af37]"
      onSubmit={(e) => {
        e.preventDefault();
        toast.info(t("newsletterComingSoon"));
      }}
    >
      <input
        type="email"
        required
        placeholder={t("newsletterPlaceholder")}
        aria-label={t("newsletterPlaceholder")}
        className="min-h-11 min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/60 focus:outline-none"
      />
      <button
        type="submit"
        className="min-h-11 shrink-0 pl-4 text-xs font-semibold tracking-[0.2em] text-[#d4af37] uppercase transition-colors duration-300 hover:text-white focus-visible:outline-2 focus-visible:outline-[#d4af37]"
      >
        {t("newsletterSubmit")}
      </button>
    </form>
  );
}
