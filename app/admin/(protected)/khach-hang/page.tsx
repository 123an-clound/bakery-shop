import type { Metadata } from "next";

import { listAdminCustomers } from "@/lib/bakery/admin/customers";
import { formatDate, formatMoney } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = { title: "Khách hàng" };

export default async function AdminCustomersPage() {
  const customers = await listAdminCustomers();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Khách hàng</h1>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>SĐT</TableHead>
              <TableHead>Tài khoản</TableHead>
              <TableHead>Số đơn</TableHead>
              <TableHead>Tổng chi tiêu</TableHead>
              <TableHead>Đơn gần nhất</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.phone}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell>
                  <Badge variant={c.hasAccount ? "default" : "secondary"}>{c.hasAccount ? "Đã đăng ký" : "Khách vãng lai"}</Badge>
                </TableCell>
                <TableCell>{c.orderCount}</TableCell>
                <TableCell>{formatMoney(c.totalSpent)}</TableCell>
                <TableCell>{formatDate(c.lastOrderAt)}</TableCell>
              </TableRow>
            ))}
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                  Chưa có khách hàng nào.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
