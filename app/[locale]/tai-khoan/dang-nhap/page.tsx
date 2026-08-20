import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/lib/bakery/types";
import { SignInForm } from "@/components/auth/sign-in-form";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/tai-khoan/dang-nhap">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Auth" });
  return { title: t("signInTitle"), robots: { index: false, follow: false } };
}

export default async function SignInPage({ params }: PageProps<"/[locale]/tai-khoan/dang-nhap">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations({ locale: locale as Locale, namespace: "Auth" });

  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-heading mb-2 text-2xl font-bold">{t("signInTitle")}</h1>
      <p className="text-muted-foreground mb-6 text-sm">{t("guestCheckoutNote")}</p>
      <SignInForm />
    </div>
  );
}
