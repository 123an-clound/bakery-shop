import Image from "next/image";
import { Clock, MapPin, Phone } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { SettingSiteData } from "@/lib/bakery/schemas";
import type { Locale } from "@/lib/bakery/types";
import { t } from "@/lib/i18n/text";
import { FacebookIcon, InstagramIcon } from "@/components/icons/social";
import { FooterNewsletter } from "@/components/layout/footer-newsletter";

// ponytail: static Unsplash placeholders — no Instagram API; swap for the shop's own photos.
const INSTAGRAM_PHOTOS = [
  "photo-1769259179866-fe27522d1879",
  "photo-1530610476181-d83430b64dcd",
  "photo-1555507036-ab1f4038808a",
  "photo-1583338917451-face2751d8d5",
  "photo-1483695028939-5bb13f8648b0",
  "photo-1775380900636-d0d40a9e2523",
].map((id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=400&h=400&q=70`);

export function Footer({ settings, locale }: { settings: SettingSiteData; locale: Locale }) {
  const tf = useTranslations("Footer");
  const tn = useTranslations("Nav");
  const instagram = settings.socials?.instagram;
  const linkClass = "w-fit transition-colors duration-300 hover:text-[#d4af37]";

  return (
    <footer className="mt-auto bg-[#1a1a1a] text-white/75">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 lg:grid-cols-12 lg:gap-10 lg:px-8">
        <div className="space-y-5 lg:col-span-4">
          <p className="font-heading text-2xl font-semibold tracking-wide text-white">{t(settings.brand_name, locale)}</p>
          {settings.tagline ? <p className="max-w-xs text-sm leading-relaxed">{t(settings.tagline, locale)}</p> : null}
          <div className="space-y-3 text-sm">
            {settings.address ? (
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[#d4af37]" strokeWidth={1.5} />
                {t(settings.address, locale)}
              </p>
            ) : null}
            {settings.hotline ? (
              <p className="flex items-center gap-3">
                <Phone className="size-4 shrink-0 text-[#d4af37]" strokeWidth={1.5} />
                <a href={`tel:${settings.hotline.replace(/\s/g, "")}`} className={linkClass}>
                  {settings.hotline}
                </a>
              </p>
            ) : null}
            {settings.opening_hours ? (
              <p className="flex items-start gap-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-[#d4af37]" strokeWidth={1.5} />
                {t(settings.opening_hours, locale)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-xs font-semibold tracking-[0.25em] text-[#d4af37] uppercase">{tf("policyTitle")}</h2>
          <nav className="mt-5 flex flex-col gap-3 text-sm">
            <Link href="/gioi-thieu" className={linkClass}>
              {tn("about")}
            </Link>
            <Link href="/chinh-sach-giao-hang" className={linkClass}>
              {tf("shippingPolicy")}
            </Link>
            <Link href="/dieu-khoan" className={linkClass}>
              {tf("terms")}
            </Link>
            <Link href="/lien-he" className={linkClass}>
              {tn("contact")}
            </Link>
          </nav>
        </div>

        <div className="lg:col-span-3">
          <h2 className="text-xs font-semibold tracking-[0.25em] text-[#d4af37] uppercase">{tf("instagramTitle")}</h2>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {INSTAGRAM_PHOTOS.map((src) => {
              const img = (
                <Image src={src} alt="" fill sizes="120px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              );
              return instagram ? (
                <a
                  key={src}
                  href={instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="group relative aspect-square overflow-hidden rounded-md focus-visible:outline-2 focus-visible:outline-[#d4af37]"
                >
                  {img}
                </a>
              ) : (
                <div key={src} className="group relative aspect-square overflow-hidden rounded-md">
                  {img}
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          <h2 className="text-xs font-semibold tracking-[0.25em] text-[#d4af37] uppercase">{tf("newsletterTitle")}</h2>
          <p className="mt-5 text-sm leading-relaxed">{tf("newsletterSubtitle")}</p>
          <FooterNewsletter />
          <div className="mt-8 flex gap-3">
            {settings.socials?.facebook ? (
              <a
                href={settings.socials.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="inline-flex size-11 items-center justify-center rounded-full border border-white/20 transition-colors duration-300 hover:border-[#d4af37] hover:text-[#d4af37]"
              >
                <FacebookIcon className="size-4" />
              </a>
            ) : null}
            {instagram ? (
              <a
                href={instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="inline-flex size-11 items-center justify-center rounded-full border border-white/20 transition-colors duration-300 hover:border-[#d4af37] hover:text-[#d4af37]"
              >
                <InstagramIcon className="size-4" />
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-6 text-center text-xs tracking-wide text-white/60 sm:px-6 lg:px-8">
        &copy; {new Date().getFullYear()} {t(settings.brand_name, locale)}. {tf("rights")}
      </div>
    </footer>
  );
}
