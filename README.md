# bakery-store

Website bán bánh kem & bánh ngọt — Next.js 16 (App Router) + Supabase. Đặc tả đầy đủ ở
[`KE-HOACH-DU-AN.md`](./KE-HOACH-DU-AN.md). Hướng dẫn dành cho chủ tiệm (không cần biết code)
sẽ được viết đầy đủ ở Phase 7 — bản này là hướng dẫn kỹ thuật cho quá trình phát triển.

## Chạy dự án

```bash
pnpm install
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Biến môi trường

Copy `.env.local.example` thành `.env.local` và điền đủ giá trị (xem file đó để biết từng biến
dùng để làm gì). `SUPABASE_SERVICE_ROLE_KEY` và `ADMIN_PASSWORD` không bao giờ được commit hay
lộ ra phía client.

## Dữ liệu mẫu (seed)

```bash
pnpm seed
```

Script `scripts/seed.ts` chèn dữ liệu mẫu vào bảng `public.bakery` (setting, theme, 6 danh mục,
24 sản phẩm, banner, blog, trang tĩnh, coupon, review, đơn hàng mẫu). Script chỉ chạy khi bảng
đang trống, để tránh chèn trùng.

> **Ảnh trong dữ liệu mẫu là ảnh placeholder** từ [Lorem Picsum](https://picsum.photos) (dịch vụ
> ảnh chờ ổn định, không vi phạm bản quyền) — **không phải ảnh sản phẩm thật**. Chủ tiệm cần thay
> bằng ảnh bánh thật của tiệm qua trang quản trị (`/admin/san-pham`, `/admin/danh-muc`,
> `/admin/giao-dien`) trước khi vận hành thật.

## Scripts

| Lệnh | Mục đích |
|---|---|
| `pnpm dev` | Chạy dev server |
| `pnpm build` | Build production |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Unit test (Vitest) |
| `pnpm e2e` | E2E test (Playwright) |
| `pnpm seed` | Seed dữ liệu mẫu vào Supabase |

## Kiến trúc dữ liệu

Toàn bộ dữ liệu nằm trong **một bảng duy nhất** `public.bakery` (single-table polymorphic +
JSONB), phân biệt bằng cột `type`. Xem `CLAUDE.md` và mục 4 của `KE-HOACH-DU-AN.md` để hiểu chi
tiết mô hình dữ liệu, và `lib/bakery/schemas.ts` cho Zod schema của từng `type`.

## Deploy

Dự án hiện **chỉ chạy local**, chưa deploy theo yêu cầu ban đầu, nhưng code được viết sẵn sàng
để deploy lên Vercel khi cần (Server Components, Route Handlers, env vars chuẩn Next.js).
