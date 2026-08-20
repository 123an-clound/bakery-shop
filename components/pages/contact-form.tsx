"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** No `contact_message` shape exists among the 15 bakery `type`s — same
 *  honest non-persisting pattern as the newsletter section. */
export function ContactForm() {
  const t = useTranslations("Contact");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        toast.info(t("comingSoon"));
      }}
    >
      <div>
        <label htmlFor="contact-name" className="mb-1 block text-sm font-medium">
          {t("nameLabel")}
        </label>
        <Input id="contact-name" name="name" required className="rounded-full" />
      </div>
      <div>
        <label htmlFor="contact-email" className="mb-1 block text-sm font-medium">
          {t("emailLabel")}
        </label>
        <Input id="contact-email" name="email" type="email" required className="rounded-full" />
      </div>
      <div>
        <label htmlFor="contact-message" className="mb-1 block text-sm font-medium">
          {t("messageLabel")}
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={4}
          className="border-input w-full rounded-2xl border p-3 text-sm"
        />
      </div>
      <Button type="submit" className="rounded-full px-8">
        {t("submit")}
      </Button>
    </form>
  );
}
