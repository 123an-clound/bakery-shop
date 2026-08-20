import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdminOrder } from "@/lib/bakery/admin/orders";
import { OrderDetailClient } from "@/components/admin/orders/order-detail-client";

export const metadata: Metadata = { title: "Chi tiết đơn hàng" };

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();

  const order = await getAdminOrder(orderId);
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Đơn hàng {order.data.code}</h1>
      <OrderDetailClient order={order} />
    </div>
  );
}
