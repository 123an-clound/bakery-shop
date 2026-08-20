"use client";

import Link from "next/link";

import type { AdminCustomCakeRow } from "@/lib/bakery/admin/custom-cake";
import { CUSTOM_CAKE_STATUS_LABELS } from "@/lib/bakery/admin/labels";
import { formatDateTime, formatMoney } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function CustomCakeList({ items }: { items: AdminCustomCakeRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Kích thước / Vị</TableHead>
            <TableHead>Ngày cần</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Báo giá</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Link href={`/admin/banh-dat-rieng/${item.id}`} className="font-medium hover:underline">
                  {item.data.customer_name}
                </Link>
                <div className="text-muted-foreground text-xs">{item.data.phone}</div>
              </TableCell>
              <TableCell>
                {item.data.size} — {item.data.flavor}
              </TableCell>
              <TableCell>{formatDateTime(item.data.need_at)}</TableCell>
              <TableCell>
                <Badge variant={item.status === "new" ? "secondary" : "default"}>
                  {CUSTOM_CAKE_STATUS_LABELS[item.status] ?? item.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{item.data.quoted_price ? formatMoney(item.data.quoted_price) : "—"}</TableCell>
            </TableRow>
          ))}
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                Chưa có yêu cầu nào.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
