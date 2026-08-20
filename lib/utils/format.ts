import dayjs from "dayjs";
import "dayjs/locale/vi";

import type { Locale } from "@/lib/bakery/types";

const VND_FORMATTER = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const EN_NUMBER_FORMATTER = new Intl.NumberFormat("en-US");

/** `350000` -> "350.000₫" (vi) or "350,000 VND" (en) — muc 3 + muc 10. */
export function formatMoney(amount: number, locale: Locale = "vi"): string {
  return locale === "en" ? `${EN_NUMBER_FORMATTER.format(amount)} VND` : VND_FORMATTER.format(amount);
}

/** `2026-08-22` -> "22/08/2026" (vi) or "Aug 22, 2026" (en). */
export function formatDate(date: string | Date, locale: Locale = "vi"): string {
  const d = dayjs(date).locale(locale === "vi" ? "vi" : "en");
  return locale === "vi" ? d.format("DD/MM/YYYY") : d.format("MMM D, YYYY");
}

export function formatDateTime(date: string | Date, locale: Locale = "vi"): string {
  const d = dayjs(date).locale(locale === "vi" ? "vi" : "en");
  return locale === "vi" ? d.format("DD/MM/YYYY HH:mm") : d.format("MMM D, YYYY h:mm A");
}

const VIETNAMESE_DIACRITICS_MAP: Record<string, string> = {
  đ: "d",
  Đ: "D",
};

/** "Bánh kem dâu tây" -> "banh-kem-dau-tay" — muc 14 (route tieng Viet khong dau). */
export function slugify(input: string): string {
  return input
    .replace(/[đĐ]/g, (c) => VIETNAMESE_DIACRITICS_MAP[c] ?? c)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
