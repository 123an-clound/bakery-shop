import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getOrderByCode } from "@/lib/bakery/orders";
import { getSiteSettings } from "@/lib/bakery/queries";
import type { Locale } from "@/lib/bakery/types";
import { formatDateTime, formatMoney } from "@/lib/utils/format";
import { buildVietQrUrl } from "@/lib/vietqr";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  CopyableRow,
  CopyOrderCodeButton,
  OrderSuccessConfetti,
} from "@/components/checkout/order-success-client";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dat-hang-thanh-cong/[code]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "OrderSuccess" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function OrderSuccessPage({
  params,
}: PageProps<"/[locale]/dat-hang-thanh-cong/[code]">) {
  const { locale, code } = await params;
  setRequestLocale(locale as Locale);

  const [t, order, settingsRow] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "OrderSuccess" }),
    getOrderByCode(code),
    getSiteSettings(),
  ]);
  if (!order) notFound();

  const settings = settingsRow?.data;
  const bank = settings?.bank;
  const showQr = order.data.payment_method === "bank_transfer" && bank;
  const transferNote = bank ? `${bank.transfer_note_prefix}${code}` : "";
  const qrUrl =
    showQr && bank
      ? buildVietQrUrl({
          bankCode: bank.bank_code,
          accountNumber: bank.account_number,
          accountName: bank.account_name,
          amount: order.data.total,
          addInfo: transferNote,
        })
      : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:px-8">
      <OrderSuccessConfetti enabled={settingsRow != null} />

      <div className="text-center">
        <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="font-heading text-primary text-2xl font-bold">{order.data.code}</span>
          <CopyOrderCodeButton code={order.data.code} />
        </div>
      </div>

      <div className="bg-secondary/30 mt-8 rounded-3xl p-6">
        <h2 className="font-heading mb-3 text-lg font-semibold">{t("itemsTitle")}</h2>
        <div className="divide-border divide-y">
          {order.data.items_snapshot.map((item, i) => (
            <div key={i} className="flex justify-between py-2 text-sm">
              <span>
                {item.name} x{item.qty}
              </span>
              <span className="font-medium">{formatMoney(item.line_total, locale as Locale)}</span>
            </div>
          ))}
        </div>
        <div className="border-border mt-3 space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("subtotal")}</span>
            <span>{formatMoney(order.data.subtotal, locale as Locale)}</span>
          </div>
          {order.data.discount > 0 ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("discount")}</span>
              <span>-{formatMoney(order.data.discount, locale as Locale)}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("shipping")}</span>
            <span>{formatMoney(order.data.shipping_fee, locale as Locale)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>{t("total")}</span>
            <span className="text-primary">{formatMoney(order.data.total, locale as Locale)}</span>
          </div>
        </div>
        <p className="text-muted-foreground mt-3 text-xs">
          {formatDateTime(order.data.delivery_at, locale as Locale)}
        </p>
      </div>

      {order.data.payment_method === "cod" ? (
        <p className="text-muted-foreground mt-6 text-center text-sm">{t("codNote")}</p>
      ) : null}

      {showQr && bank && qrUrl ? (
        <div className="mt-8 text-center">
          <h2 className="font-heading mb-4 text-lg font-semibold">{t("bankTransferTitle")}</h2>
          <Image
            src={qrUrl}
            alt="VietQR"
            width={280}
            height={280}
            className="shadow-soft mx-auto rounded-3xl"
            unoptimized
          />
          <div className="bg-secondary/30 mx-auto mt-4 max-w-sm rounded-2xl p-4 text-left">
            <CopyableRow label={t("bankName")} value={bank.bank_name} />
            <CopyableRow label={t("accountNumber")} value={bank.account_number} />
            <CopyableRow label={t("accountName")} value={bank.account_name} />
            <CopyableRow label={t("amount")} value={formatMoney(order.data.total, locale as Locale)} />
            <CopyableRow label={t("transferNote")} value={transferNote} />
          </div>
          <p className="text-muted-foreground mt-3 text-xs">{t("bankConfirmNote")}</p>
        </div>
      ) : null}

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button variant="outline" className="rounded-full" asChild>
          <Link href="/tra-cuu-don-hang">{t("trackOrder")}</Link>
        </Button>
        <Button className="rounded-full" asChild>
          <Link href="/san-pham">{t("continueShopping")}</Link>
        </Button>
      </div>
    </div>
  );
}
