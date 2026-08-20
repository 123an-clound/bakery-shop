import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdminBanner } from "@/lib/bakery/admin/banners";
import { BannerForm } from "@/components/admin/banners/banner-form";

export const metadata: Metadata = { title: "Sửa banner" };

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bannerId = Number(id);
  if (!Number.isInteger(bannerId)) notFound();

  const banner = await getAdminBanner(bannerId);
  if (!banner) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Sửa banner</h1>
      <BannerForm initial={banner} />
    </div>
  );
}
