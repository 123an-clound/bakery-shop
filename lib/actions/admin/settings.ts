"use server";

import { updateTag } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { updateBakeryRow, createBakeryRow } from "@/lib/bakery/mutations";
import { getAdminSiteSettings } from "@/lib/bakery/admin/theme";
import { getAdminPrivateSettings } from "@/lib/bakery/admin/settings";
import { settingSiteDataSchema, settingPrivateDataSchema, type SettingSiteData } from "@/lib/bakery/schemas";
import { sendEmail } from "@/lib/email/client";
import type { AdminActionResult } from "./types";

/** Merges into the *existing* `setting/site` row — Theme Editor owns brand_name/tagline/logo/favicon, this owns the rest of mục 9.12. */
export async function saveSiteSettings(
  patch: Omit<SettingSiteData, "brand_name" | "tagline" | "logo_url" | "favicon_url">,
): Promise<AdminActionResult> {
  await requireAdmin();
  const current = await getAdminSiteSettings();
  if (!current) return { ok: false, error: "not_found" };

  const merged = settingSiteDataSchema.parse({ ...current.data, ...patch });
  await updateBakeryRow(current.id, "setting", { data: merged });
  updateTag("settings");
  return { ok: true };
}

export async function saveNotifyEmails(emails: string[]): Promise<AdminActionResult> {
  await requireAdmin();
  const parsed = settingPrivateDataSchema.parse({ notify_emails: emails });
  const current = await getAdminPrivateSettings();

  if (current) {
    await updateBakeryRow(current.id, "setting", { data: parsed });
  } else {
    await createBakeryRow({ type: "setting", data: parsed, slug: "private", status: "draft" });
  }
  return { ok: true };
}

export async function sendTestEmail(to: string): Promise<AdminActionResult> {
  await requireAdmin();
  const result = await sendEmail({
    to,
    subject: "Email thử nghiệm từ trang quản trị",
    html: "<p>Đây là email thử nghiệm. Nếu bạn nhận được email này, cấu hình gửi email đang hoạt động đúng.</p>",
  });
  return result.sent ? { ok: true } : { ok: false, error: result.error };
}
