import type { Metadata } from "next";
import Link from "next/link";

import {
  getDashboardStats,
  getRevenueDaily,
  getOrderStatusBreakdown,
  getRecentOrders,
  getTopSellingProducts,
} from "@/lib/bakery/admin/dashboard";
import { ORDER_STATUS_BADGE_VARIANT, ORDER_STATUS_LABELS } from "@/lib/bakery/admin/labels";
import { formatMoney, formatDateTime } from "@/lib/utils/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RevenueChart, OrderStatusChart } from "@/components/admin/dashboard-charts";

export const metadata: Metadata = { title: "Tổng quan" };

export default async function AdminDashboardPage() {
  const [stats, revenue, statusBreakdown, recentOrders, topProducts] = await Promise.all([
    getDashboardStats(),
    getRevenueDaily(30),
    getOrderStatusBreakdown(),
    getRecentOrders(10),
    getTopSellingProducts(5),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Tổng quan</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Doanh thu hôm nay</CardDescription>
            <CardTitle className="text-2xl">{formatMoney(stats.revenueToday)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Doanh thu tháng này</CardDescription>
            <CardTitle className="text-2xl">{formatMoney(stats.revenueThisMonth)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Đơn chờ xử lý</CardDescription>
            <CardTitle className="text-2xl">{stats.pendingOrders}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Đánh giá chờ duyệt</CardDescription>
            <CardTitle className="text-2xl">{stats.pendingReviews}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Doanh thu 30 ngày</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenue} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Đơn theo trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderStatusChart data={statusBreakdown} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Đơn hàng mới nhất</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Tổng tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link href={`/admin/don-hang/${order.id}`} className="font-medium hover:underline">
                        {order.code}
                      </Link>
                      <div className="text-muted-foreground text-xs">{formatDateTime(order.createdAt)}</div>
                    </TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>
                      <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status] ?? "secondary"}>
                        {ORDER_STATUS_LABELS[order.status] ?? order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatMoney(order.total)}</TableCell>
                  </TableRow>
                ))}
                {recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground text-center">
                      Chưa có đơn hàng nào.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top sản phẩm bán chạy</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead className="text-right">SL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((p) => (
                  <TableRow key={p.productId}>
                    <TableCell className="max-w-40 truncate">{p.name}</TableCell>
                    <TableCell className="text-right">{p.qtySold}</TableCell>
                  </TableRow>
                ))}
                {topProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground text-center">
                      Chưa có dữ liệu.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
