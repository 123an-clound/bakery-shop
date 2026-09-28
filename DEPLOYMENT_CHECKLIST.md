# Production deployment checklist

Before promoting the app to a public environment:

- Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin (never localhost).
- Set a unique `ADMIN_PASSWORD` and at least 32 random characters for `ADMIN_SESSION_SECRET`.
- Configure Supabase URL, anon key, service-role key, Resend API key and verified sender.
- Apply every SQL file in `supabase/migrations/` in order and verify RLS/storage policies.
- Use a shared rate-limit store (Redis/Upstash or the hosting provider's firewall) for multi-instance deployments.
- Add an atomic database RPC/transaction for stock, coupon usage, order and order-item writes before accepting concurrent orders.
- Run `pnpm audit`, `pnpm run build`, unit tests, accessibility tests and a Lighthouse run against the deployed URL.
- Remove test records whose names start with `E2E ` only after confirming they are not real customer data.
