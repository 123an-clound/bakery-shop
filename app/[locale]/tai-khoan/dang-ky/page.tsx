import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/lib/bakery/types";
import { SignUpForm } from "@/components/auth/sign-up-form";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/tai-khoan/dang-ky">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Auth" });
  return { title: t("signUpTitle"), robots: { index: false, follow: false } };
}

export default async function SignUpPage({ params }: PageProps<"/[locale]/tai-khoan/dang-ky">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations({ locale: locale as Locale, namespace: "Auth" });

  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-heading mb-2 text-2xl font-bold">{t("signUpTitle")}</h1>
      <p className="text-muted-foreground mb-6 text-sm">{t("guestCheckoutNote")}</p>
      <SignUpForm />
    </div>
  );
}
