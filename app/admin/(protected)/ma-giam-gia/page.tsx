import type { Metadata } from "next";

import { listAdminCoupons } from "@/lib/bakery/admin/coupons";
import { CouponsClient } from "@/components/admin/coupons/coupons-client";

export const metadata: Metadata = { title: "Mã giảm giá" };

export default async function AdminCouponsPage() {
  const coupons = await listAdminCoupons();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Mã giảm giá</h1>
      <CouponsClient coupons={coupons} />
    </div>
  );
}
