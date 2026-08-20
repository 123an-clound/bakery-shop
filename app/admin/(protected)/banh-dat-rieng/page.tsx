import type { Metadata } from "next";

import { listAdminCustomCakes } from "@/lib/bakery/admin/custom-cake";
import { CustomCakeList } from "@/components/admin/custom-cake/custom-cake-list";

export const metadata: Metadata = { title: "Bánh đặt riêng" };

export default async function AdminCustomCakePage() {
  const items = await listAdminCustomCakes();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Bánh đặt riêng</h1>
      <CustomCakeList items={items} />
    </div>
  );
}
