import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { getAdminOrder } from "@/lib/bakery/admin/orders";
import { getSiteSettings } from "@/lib/bakery/queries";
import { buildVietQrUrl } from "@/lib/vietqr";
import { formatDateTime, formatMoney } from "@/lib/utils/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/bakery/admin/labels";
import { PrintButton } from "@/components/admin/orders/print-button";

export const metadata: Metadata = { title: "In hoá đơn" };

export default async function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();

  const [order, settingsRow] = await Promise.all([getAdminOrder(orderId), getSiteSettings()]);
  if (!order) notFound();

  const settings = settingsRow?.data;
  const brandName = settings?.brand_name.vi ?? "Tiệm bánh";
  const qrUrl =
    order.data.payment_method === "bank_transfer" && settings?.bank
      ? buildVietQrUrl({
          bankCode: settings.bank.bank_code,
          accountNumber: settings.bank.account_number,
          accountName: settings.bank.account_name,
          amount: order.data.total,
          addInfo: `${settings.bank.transfer_note_prefix} ${order.data.code}`,
        })
      : null;

  return (
    <div className="mx-auto max-w-[148mm] p-6 print:p-0">
      <div className="mb-4 flex justify-end print:hidden">
        <PrintButton />
      </div>

      <div className="space-y-4 text-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {settings?.logo_url ? (
              <Image src={settings.logo_url} alt={brandName} width={40} height={40} className="rounded-full" />
            ) : null}
            <div>
              <div className="text-lg font-bold">{brandName}</div>
              {settings?.hotline ? <div className="text-xs">{settings.hotline}</div> : null}
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">HOÁ ĐƠN</div>
            <div>{order.data.code}</div>
            <div className="text-xs">{formatDateTime(order.createdAt)}</div>
          </div>
        </div>

        <hr />

        <div>
          <div className="font-medium">{order.data.customer_name}</div>
          <div>{order.data.phone}</div>
          <div>
            {order.data.address.line}
            {order.data.address.ward ? `, ${order.data.address.ward}` : ""}
            {order.data.address.district ? `, ${order.data.address.district}` : ""}, {order.data.address.city}
          </div>
          <div>Giao lúc: {formatDateTime(order.data.delivery_at)}</div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-1 text-left">Sản phẩm</th>
              <th className="py-1 text-right">SL</th>
              <th className="py-1 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.data.items_snapshot.map((item, i) => (
              <tr key={i} className="border-b">
                <td className="py-1">{item.name}</td>
                <td className="py-1 text-right">{item.qty}</td>
                <td className="py-1 text-right">{formatMoney(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Tạm tính</span>
            <span>{formatMoney(order.data.subtotal)}</span>
          </div>
          {order.data.discount > 0 ? (
            <div className="flex justify-between">
              <span>Giảm giá</span>
              <span>-{formatMoney(order.data.discount)}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span>Phí vận chuyển</span>
            <span>{formatMoney(order.data.shipping_fee)}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Tổng cộng</span>
            <span>{formatMoney(order.data.total)}</span>
          </div>
          <div className="text-xs">Thanh toán: {PAYMENT_METHOD_LABELS[order.data.payment_method]}</div>
        </div>

        {qrUrl ? (
          <div className="flex flex-col items-center gap-1 pt-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- external VietQR image, dimensions unknown ahead of time */}
            <img src={qrUrl} alt="VietQR" width={180} height={180} />
            <span className="text-xs">Quét mã để chuyển khoản</span>
          </div>
        ) : null}

        <p className="text-muted-foreground pt-4 text-center text-xs">Cảm ơn quý khách đã ủng hộ {brandName}!</p>
      </div>
    </div>
  );
}
