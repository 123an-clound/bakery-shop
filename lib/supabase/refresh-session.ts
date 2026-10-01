import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, type NextResponse } from "next/server";
import type { Database } from "./database.types";

/** Refresh before i18n builds its rewrite, then copy cookies onto that response. */
export async function refreshCustomerSession(request: NextRequest) {
  const pending: Array<{ name: string; value: string; options: CookieOptions }> = [];
  const cacheHeaders: Record<string, string> = {};
  if (request.cookies.getAll().some((cookie) => /^sb-.+-auth-token(?:\.\d+)?$/.test(cookie.name))) {
    const client = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookies, headers) => {
            Object.assign(cacheHeaders, headers);
            for (const cookie of cookies) {
              request.cookies.set(cookie.name, cookie.value);
              pending.push(cookie);
            }
          },
        },
      },
    );
    // This is verification, not an authorization shortcut; the DAL still uses getUser().
    await client.auth.getUser();
  }
  return (response: NextResponse) => {
    for (const [key, value] of Object.entries(cacheHeaders)) response.headers.set(key, value);
    for (const cookie of pending) response.cookies.set(cookie.name, cookie.value, cookie.options);
    if (pending.length) {
      response.headers.set("Cache-Control", "private, no-store");
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");
    }
    return response;
  };
}
