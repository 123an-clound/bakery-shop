"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import type { AdminOrderRow } from "@/lib/bakery/admin/orders";
import { ORDER_STATUS_BADGE_VARIANT, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/bakery/admin/labels";
import { ORDER_STATUSES } from "@/lib/bakery/types";
import { formatDateTime, formatMoney } from "@/lib/utils/format";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DELIVERY_WARNING_MS = 24 * 60 * 60 * 1000;

export function OrdersClient({ orders }: { orders: AdminOrderRow[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (paymentMethod !== "all" && o.data.payment_method !== paymentMethod) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!o.data.code.toLowerCase().includes(q) && !o.data.phone.includes(q) && !o.data.customer_name.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [orders, search, status, paymentMethod]);

  const exportUrl = `/api/admin/orders/export?${new URLSearchParams({
    ...(status !== "all" ? { status } : {}),
    ...(paymentMethod !== "all" ? { paymentMethod } : {}),
    ...(search ? { search } : {}),
  }).toString()}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input placeholder="Tìm mã đơn / SĐT / tên..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-64" />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-44">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger className="h-9 w-48">
              <SelectValue placeholder="Thanh toán" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phương thức</SelectItem>
              <SelectItem value="cod">COD</SelectItem>
              <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" asChild>
          <a href={exportUrl}>Xuất CSV</a>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đơn</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Giao lúc</TableHead>
              <TableHead>Thanh toán</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Tổng tiền</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((order) => {
              const deliverySoon =
                order.status !== "completed" &&
                order.status !== "cancelled" &&
                new Date(order.data.delivery_at).getTime() - Date.now() < DELIVERY_WARNING_MS;
              return (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link href={`/admin/don-hang/${order.id}`} className="font-medium hover:underline">
                      {order.data.code}
                    </Link>
                    <div className="text-muted-foreground text-xs">{formatDateTime(order.createdAt)}</div>
                  </TableCell>
                  <TableCell>
                    <div>{order.data.customer_name}</div>
                    <div className="text-muted-foreground text-xs">{order.data.phone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {deliverySoon ? <AlertTriangle className="text-destructive size-3.5" /> : null}
                      {formatDateTime(order.data.delivery_at)}
                    </div>
                  </TableCell>
                  <TableCell>{PAYMENT_METHOD_LABELS[order.data.payment_method]}</TableCell>
                  <TableCell>
                    <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status] ?? "secondary"}>
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatMoney(order.data.total)}</TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                  Không tìm thấy đơn hàng nào.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
