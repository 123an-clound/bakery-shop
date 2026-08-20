import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdminCustomCake } from "@/lib/bakery/admin/custom-cake";
import { CustomCakeDetail } from "@/components/admin/custom-cake/custom-cake-detail";

export const metadata: Metadata = { title: "Chi tiết yêu cầu đặt bánh" };

export default async function AdminCustomCakeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cakeId = Number(id);
  if (!Number.isInteger(cakeId)) notFound();

  const cake = await getAdminCustomCake(cakeId);
  if (!cake) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Yêu cầu đặt bánh — {cake.data.customer_name}</h1>
      <CustomCakeDetail cake={cake} />
    </div>
  );
}
