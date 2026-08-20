import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

// Next.js 16 renamed the `middleware.ts` convention to `proxy.ts` — see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
export default createMiddleware(routing);

export const config = {
  // Skip /admin, /api, static assets. /admin gets its own auth-gate proxy in Phase 6.
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
