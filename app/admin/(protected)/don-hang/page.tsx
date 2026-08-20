import type { Metadata } from "next";

import { listAdminOrders } from "@/lib/bakery/admin/orders";
import { OrdersClient } from "@/components/admin/orders/orders-client";

export const metadata: Metadata = { title: "Đơn hàng" };

export default async function AdminOrdersPage() {
  const orders = await listAdminOrders();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Đơn hàng</h1>
      <OrdersClient orders={orders} />
    </div>
  );
}
