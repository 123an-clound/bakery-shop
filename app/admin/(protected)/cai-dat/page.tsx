import type { Metadata } from "next";

import { getAdminSiteSettings } from "@/lib/bakery/admin/theme";
import { getAdminPrivateSettings } from "@/lib/bakery/admin/settings";
import { SettingsClient } from "@/components/admin/settings/settings-client";

export const metadata: Metadata = { title: "Cài đặt" };

export default async function AdminSettingsPage() {
  const [siteSettings, privateSettings] = await Promise.all([getAdminSiteSettings(), getAdminPrivateSettings()]);
  const shop = siteSettings?.data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Cài đặt</h1>
      <SettingsClient
        initial={{
          hotline: shop?.hotline,
          email: shop?.email,
          address: shop?.address,
          map_embed: shop?.map_embed,
          opening_hours: shop?.opening_hours,
          socials: shop?.socials,
          bank: shop?.bank,
          shipping: shop?.shipping,
          seo: shop?.seo,
        }}
        initialNotifyEmails={privateSettings?.data.notify_emails ?? []}
      />
    </div>
  );
}
