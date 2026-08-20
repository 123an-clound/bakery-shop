"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Printer } from "lucide-react";

import type { AdminOrderRow } from "@/lib/bakery/admin/orders";
import { updateOrderStatus, markOrderPaid, updateOrderInternalNote } from "@/lib/actions/admin/orders";
import {
  ORDER_STATUS_BADGE_VARIANT,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/bakery/admin/labels";
import { ORDER_STATUSES } from "@/lib/bakery/types";
import { formatDateTime, formatMoney } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export function OrderDetailClient({ order }: { order: AdminOrderRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState(order.data.internal_note ?? "");

  function handleStatusChange(status: string) {
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, status);
      if (result.ok) {
        toast.success("Đã cập nhật trạng thái đơn hàng.");
        router.refresh();
      } else {
        toast.error("Không cập nhật được trạng thái.");
      }
    });
  }

  function handleMarkPaid() {
    startTransition(async () => {
      const result = await markOrderPaid(order.id);
      if (result.ok) {
        toast.success("Đã đánh dấu đã thanh toán.");
        router.refresh();
      }
    });
  }

  function handleSaveNote() {
    startTransition(async () => {
      const result = await updateOrderInternalNote(order.id, note);
      if (result.ok) toast.success("Đã lưu ghi chú.");
    });
  }

  const zaloHref = `https://zalo.me/${order.data.phone}`;
  const telHref = `tel:${order.data.phone}`;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Sản phẩm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {order.data.items_snapshot.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div>
                  <div>{item.name} x{item.qty}</div>
                  {Object.keys(item.options).length > 0 ? (
                    <div className="text-muted-foreground text-xs">
                      {Object.entries(item.options).map(([k, v]) => `${k}: ${v}`).join(", ")}
                    </div>
                  ) : null}
                </div>
                <span>{formatMoney(item.line_total)}</span>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tạm tính</span>
              <span>{formatMoney(order.data.subtotal)}</span>
            </div>
            {order.data.discount > 0 ? (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Giảm giá {order.data.coupon_code ? `(${order.data.coupon_code})` : ""}</span>
                <span>-{formatMoney(order.data.discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Phí vận chuyển</span>
              <span>{formatMoney(order.data.shipping_fee)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Tổng cộng</span>
              <span>{formatMoney(order.data.total)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lịch sử trạng thái</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...order.data.timeline].reverse().map((entry, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <Badge variant={ORDER_STATUS_BADGE_VARIANT[entry.status] ?? "secondary"}>
                  {ORDER_STATUS_LABELS[entry.status] ?? entry.status}
                </Badge>
                <div>
                  <div className="text-muted-foreground text-xs">{formatDateTime(entry.at)}</div>
                  {entry.note ? <div>{entry.note}</div> : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ghi chú nội bộ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Chỉ admin nhìn thấy..." />
            <Button size="sm" variant="outline" disabled={isPending} onClick={handleSaveNote}>
              Lưu ghi chú
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {order.data.code}
              <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status] ?? "secondary"}>
                {ORDER_STATUS_LABELS[order.status] ?? order.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="font-medium">{order.data.customer_name}</div>
              <div className="text-muted-foreground">{order.data.phone}</div>
              {order.data.email ? <div className="text-muted-foreground">{order.data.email}</div> : null}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <a href={telHref}>Gọi</a>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={zaloHref} target="_blank" rel="noopener noreferrer">
                  Zalo
                </a>
              </Button>
            </div>
            <Separator />
            <div>
              <div className="text-muted-foreground text-xs">Địa chỉ giao hàng</div>
              <div>
                {order.data.address.line}
                {order.data.address.ward ? `, ${order.data.address.ward}` : ""}
                {order.data.address.district ? `, ${order.data.address.district}` : ""}, {order.data.address.city}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Thời gian giao</div>
              <div>{formatDateTime(order.data.delivery_at)}</div>
            </div>
            {order.data.note ? (
              <div>
                <div className="text-muted-foreground text-xs">Ghi chú của khách</div>
                <div>{order.data.note}</div>
              </div>
            ) : null}
            <Separator />
            <div>
              <div className="text-muted-foreground text-xs">Thanh toán</div>
              <div>
                {PAYMENT_METHOD_LABELS[order.data.payment_method]} — {PAYMENT_STATUS_LABELS[order.data.payment_status]}
              </div>
              {order.data.payment_status !== "paid" ? (
                <Button size="sm" variant="outline" className="mt-2" disabled={isPending} onClick={handleMarkPaid}>
                  Đánh dấu đã thanh toán
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Đổi trạng thái</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={order.status} onValueChange={handleStatusChange} disabled={isPending}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {ORDER_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/admin/don-hang/${order.id}/in`} target="_blank">
                <Printer className="size-4" />
                In hoá đơn
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
