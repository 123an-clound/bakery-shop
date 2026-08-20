import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import { getMyOrders } from "@/lib/bakery/orders";
import { signOut } from "@/lib/actions/auth";
import type { Locale } from "@/lib/bakery/types";
import { formatDateTime, formatMoney } from "@/lib/utils/format";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export async function generateMetadata({ params }: PageProps<"/[locale]/tai-khoan">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Account" });
  return { title: t("pageTitle"), robots: { index: false, follow: false } };
}

export default async function AccountPage({ params }: PageProps<"/[locale]/tai-khoan">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/tai-khoan/dang-nhap");

  const [t, orders] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "Account" }),
    getMyOrders(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">{t("pageTitle")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{user.email}</p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline" className="rounded-full">
            {t("signOut")}
          </Button>
        </form>
      </div>

      <Button variant="link" className="text-primary mt-4 px-0" asChild>
        <Link href="/tai-khoan/yeu-thich">{t("favoritesLink")} →</Link>
      </Button>

      <h2 className="font-heading mt-8 mb-4 text-xl font-semibold">{t("ordersTitle")}</h2>
      {orders.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("noOrders")}</p>
      ) : (
        <div className="divide-border divide-y">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">{order.data.code}</p>
                <p className="text-muted-foreground text-xs">
                  {formatDateTime(order.created_at, locale as Locale)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-primary font-semibold">{formatMoney(order.data.total, locale as Locale)}</p>
                <Link
                  href={`/tra-cuu-don-hang`}
                  className="text-muted-foreground text-xs hover:underline"
                >
                  {t("viewOrder")}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
