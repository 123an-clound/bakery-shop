import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        // SAMEORIGIN, not DENY: the Theme Editor (Phase 6, mục 9.6) embeds
        // the customer site in its own live-preview iframe
        // (/?preview=1) — still blocks any *other* origin from framing us
        // (the actual clickjacking threat), just not ourselves.
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        // Basic CSP (mục 6.3). 'unsafe-inline'/'unsafe-eval' on script-src
        // are needed for Next.js's own inline bootstrap scripts and dev-mode
        // HMR — a strict nonce-based CSP would need per-request nonces
        // wired through every layout, out of scope for "CSP cơ bản". Still
        // meaningfully blocks third-party script injection since script-src
        // has no external hosts at all.
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https://*.supabase.co https://picsum.photos https://img.vietqr.io",
            "font-src 'self' data:",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
            "frame-src 'self' https://www.google.com https://maps.google.com",
            "frame-ancestors 'self'",
            "object-src 'none'",
            "base-uri 'self'",
          ].join("; "),
        },
      ],
    },
  ],
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
