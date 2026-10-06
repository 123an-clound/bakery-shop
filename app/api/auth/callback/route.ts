import { NextResponse } from "next/server";

import { ensureCustomerProfile } from "@/lib/bakery/customer-profile";
import { getSiteUrl } from "@/lib/seo/site-url";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  const flowId = params.get("sb_flow_id");
  let destination = "/tai-khoan/dang-nhap";

  if (code && code.length <= 2048 && (!flowId || flowId.length <= 2048)) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined,
    );
    if (!error && data.user) {
      await ensureCustomerProfile(data.user);
      destination = "/tai-khoan";
    }
  }

  // Ignore submitted redirect destinations and use the configured bakery origin.
  const response = NextResponse.redirect(new URL(destination, getSiteUrl()));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
