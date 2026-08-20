import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";
import { ADMIN_SESSION_COOKIE, verifyAdminToken } from "./lib/auth/admin-session";

// Next.js 16 renamed the `middleware.ts` convention to `proxy.ts` — see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
const intlMiddleware = createMiddleware(routing);

const ADMIN_LOGIN_PATH = "/admin/login";
const ADMIN_LOGIN_API_PATH = "/api/admin/login";

/**
 * Admin auth gate (mục 6.2 lớp 3) — runs before every `/admin/*` page and
 * `/api/admin/*` write. `/admin/login` and `POST /api/admin/login` are the
 * only paths reachable without a valid `bk_admin` cookie.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/admin")) {
    if (pathname === ADMIN_LOGIN_API_PATH) return NextResponse.next();
    const valid = await verifyAdminToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
    if (!valid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const valid = await verifyAdminToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
    if (pathname === ADMIN_LOGIN_PATH) {
      if (valid) return NextResponse.redirect(new URL("/admin", request.url));
      return NextResponse.next();
    }
    if (!valid) {
      const url = new URL(ADMIN_LOGIN_PATH, request.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!api|admin|_next|_vercel|.*\\..*).*)", // customer-facing pages (next-intl)
    "/admin/:path*", // admin pages
    "/api/admin/:path*", // admin API
  ],
};
