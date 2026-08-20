import "server-only";

import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, verifyAdminToken } from "./admin-session";

/** Read-only check — safe to call from a page/layout to branch UI. */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

/**
 * Defense-in-depth guard for every admin Server Action — mục 6.1 lớp 3.
 * `proxy.ts` already blocks page/API access without a valid session, but
 * Server Actions are called via their own POST endpoint, so each one
 * re-checks here rather than relying solely on the proxy.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    throw new Error("unauthorized");
  }
}
