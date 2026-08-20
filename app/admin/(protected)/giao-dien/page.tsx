import type { Metadata } from "next";

import { getAdminTheme, getAdminSiteSettings } from "@/lib/bakery/admin/theme";
import { DEFAULT_THEME } from "@/lib/theme/default-theme";
import { ThemeEditor } from "@/components/admin/theme/theme-editor";

export const metadata: Metadata = { title: "Giao diện" };

export default async function AdminThemePage() {
  const [themeRow, settingsRow] = await Promise.all([getAdminTheme(), getAdminSiteSettings()]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Giao diện</h1>
      <ThemeEditor
        initialTheme={themeRow?.data ?? DEFAULT_THEME}
        initialBrand={{
          brandName: settingsRow?.data.brand_name ?? { vi: "" },
          tagline: settingsRow?.data.tagline,
          logoUrl: settingsRow?.data.logo_url,
          faviconUrl: settingsRow?.data.favicon_url,
        }}
      />
    </div>
  );
}
