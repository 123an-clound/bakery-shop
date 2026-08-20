import { MapPin, Phone } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { SettingSiteData } from "@/lib/bakery/schemas";
import type { Locale } from "@/lib/bakery/types";
import { t } from "@/lib/i18n/text";
import { FacebookIcon, InstagramIcon } from "@/components/icons/social";

export function Footer({ settings, locale }: { settings: SettingSiteData; locale: Locale }) {
  const tf = useTranslations("Footer");
  const tn = useTranslations("Nav");

  return (
    <footer className="bg-secondary/40 border-border mt-16 border-t">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="space-y-3 md:col-span-2">
          <span className="font-heading text-brand-accent text-lg font-bold">
            {t(settings.brand_name, locale)}
          </span>
          {settings.tagline ? (
            <p className="text-muted-foreground text-sm">{t(settings.tagline, locale)}</p>
          ) : null}
          <div className="text-muted-foreground space-y-1.5 text-sm">
            {settings.address ? (
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                {t(settings.address, locale)}
              </p>
            ) : null}
            {settings.hotline ? (
              <p className="flex items-center gap-2">
                <Phone className="size-4 shrink-0" />
                {settings.hotline}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-heading text-sm font-semibold">{tf("policyTitle")}</h3>
          <nav className="text-muted-foreground flex flex-col gap-1.5 text-sm">
            <Link href="/gioi-thieu" className="hover:text-brand-accent">
              {tn("about")}
            </Link>
            <Link href="/chinh-sach-giao-hang" className="hover:text-brand-accent">
              {tf("shippingPolicy")}
            </Link>
            <Link href="/dieu-khoan" className="hover:text-brand-accent">
              {tf("terms")}
            </Link>
            <Link href="/lien-he" className="hover:text-brand-accent">
              {tn("contact")}
            </Link>
          </nav>
        </div>

        <div className="space-y-2">
          <h3 className="font-heading text-sm font-semibold">{tf("followTitle")}</h3>
          <div className="flex gap-3">
            {settings.socials?.facebook ? (
              <a
                href={settings.socials.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="hover:bg-primary hover:text-primary-foreground rounded-full border p-2 transition-colors"
              >
                <FacebookIcon className="size-4" />
              </a>
            ) : null}
            {settings.socials?.instagram ? (
              <a
                href={settings.socials.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="hover:bg-primary hover:text-primary-foreground rounded-full border p-2 transition-colors"
              >
                <InstagramIcon className="size-4" />
              </a>
            ) : null}
          </div>
          {settings.opening_hours ? (
            <p className="text-muted-foreground text-sm">{t(settings.opening_hours, locale)}</p>
          ) : null}
        </div>
      </div>

      <div className="border-border text-muted-foreground border-t px-4 py-4 text-center text-xs sm:px-6 lg:px-8">
        &copy; {new Date().getFullYear()} {t(settings.brand_name, locale)}. {tf("rights")}
      </div>
    </footer>
  );
}
