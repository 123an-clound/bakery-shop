import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * `setting/private` (status='draft') holds `notify_emails` — invisible to
 * anon/authenticated via RLS, so this always reads through the service-role
 * client. Used wherever the shop needs to be notified (new order, new
 * custom cake request).
 */
export async function getPrivateNotifyEmails(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("bakery")
    .select("data")
    .eq("type", "setting")
    .eq("slug", "private")
    .maybeSingle();
  const notifyEmails = (data?.data as { notify_emails?: string[] } | undefined)?.notify_emails;
  return notifyEmails ?? [];
}
