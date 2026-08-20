import "server-only";

import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "Tiem Banh <onboarding@resend.dev>";

/**
 * Gửi email qua Resend. Nếu chưa có RESEND_API_KEY, log ra console + không
 * giả vờ đã gửi thành công — muc 8.6 bullet 6 va muc "KHONG DUOC LAM" #10.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<{ sent: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email] RESEND_API_KEY chua duoc cau hinh. Bo qua gui email that.`);
    // mục 6.3: khong log du lieu ca nhan (email khach) ra console o production —
    // dev van thay dia chi that de debug de dang.
    const recipients = process.env.NODE_ENV === "production" ? "[redacted]" : JSON.stringify(to);
    console.log(`[email] TODO: to=${recipients} subject="${subject}"`);
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error("[email] Resend that bai:", error);
      return { sent: false, error: error.message };
    }
    return { sent: true, id: data?.id };
  } catch (err) {
    console.error("[email] Resend loi khong xac dinh:", err);
    return { sent: false, error: err instanceof Error ? err.message : "unknown error" };
  }
}
