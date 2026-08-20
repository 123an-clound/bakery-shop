import type { Metadata } from "next";

import { listAdminBanners } from "@/lib/bakery/admin/banners";
import { BannersClient } from "@/components/admin/banners/banners-client";

export const metadata: Metadata = { title: "Banner" };

export default async function AdminBannersPage() {
  const banners = await listAdminBanners();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Banner</h1>
      <BannersClient banners={banners} />
    </div>
  );
}
