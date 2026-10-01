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
        ...(process.env.VERCEL_ENV === "preview" || process.env.SITE_NOINDEX === "true"
          ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : []),
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
            // Meshopt decodes the existing model with WebAssembly, not JS eval.
            process.env.NODE_ENV === "development" ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            // canvas-confetti renders in a Worker built from a blob: URL.
            "worker-src 'self' blob:",
            "img-src 'self' data: blob: https://*.supabase.co https://picsum.photos https://img.vietqr.io",
            "font-src 'self' data:",
            // blob: — GLTFLoader fetches the model's embedded textures as blob URLs.
            "connect-src 'self' blob: https://*.supabase.co wss://*.supabase.co",
            "frame-src 'self' https://www.google.com https://maps.google.com",
            "frame-ancestors 'self'",
            "object-src 'none'",
            "base-uri 'self'",
          ].join("; "),
        },
      ],
    },
    {
      source: "/:locale(en)?/:private(gio-hang|thanh-toan|tai-khoan|dat-hang-thanh-cong|tra-cuu-don-hang|admin|dev)/:path*",
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "private, no-store" }],
    },
  ],
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
