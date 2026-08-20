import type { Metadata } from "next";

import { BannerForm } from "@/components/admin/banners/banner-form";

export const metadata: Metadata = { title: "Thêm banner" };

export default function NewBannerPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Thêm banner</h1>
      <BannerForm />
    </div>
  );
}
