# Hướng dẫn xử lý blocker production

Trạng thái 01-10-2026: Supabase trong `.env.local` là production. Workspace này **không có** Supabase CLI, `supabase/config.toml` hoặc Docker daemon đang chạy; repo cũng chưa có cấu hình staging. Không chạy `pnpm e2e`, `pnpm seed`, `supabase db push`, migration SQL hay test POST với `.env.local` hiện tại.

## 1. Chuẩn bị sandbox trước

1. Tạo một Supabase project/branch riêng cho staging, không nhận traffic khách thật. Dùng schema giống production và dữ liệu đã ẩn danh; không copy token, mật khẩu admin, email khách hoặc ảnh tham khảo riêng tư.
2. Dùng riêng bộ env cho staging: project URL/key staging, mật khẩu admin thử nghiệm và email sandbox. Không thay `.env.local` hiện tại trước khi lưu an toàn tên/mục đích biến; tuyệt đối không đưa giá trị vào Git, log hoặc ảnh chụp.
3. Cần một project đã có schema nền bakery. Migration cũ `0001`–`0004` có tên/version từ giai đoạn trước và `0001` giả định bảng `public.bakery` đã tồn tại; không chạy cả thư mục trên project Supabase trống.

## 2. Đối chiếu migration trước khi áp dụng

Supabase CLI chưa được cài trong workspace và `supabase/config.toml` chưa tồn tại. Cài CLI theo [hướng dẫn chính thức](https://supabase.com/docs/guides/local-development/cli/getting-started), chạy trong một bản checkout/worktree riêng, rồi liên kết **project ref staging** đã xác minh. Không liên kết project production.

```powershell
pnpm dlx supabase --version
pnpm dlx supabase init
pnpm dlx supabase login
pnpm dlx supabase link --project-ref <STAGING_PROJECT_REF>
pnpm dlx supabase migration list --linked
pnpm dlx supabase db push --linked --dry-run
```

CLI `db push --dry-run` chỉ liệt kê migration sẽ chạy; nó không thay cho việc kiểm tra project ref. Xác nhận project ref staging trong Supabase Dashboard trước mỗi lệnh. Xem [tài liệu migration chính thức](https://supabase.com/docs/guides/deployment/database-migrations) và [CLI `db push`](https://supabase.com/docs/reference/cli/supabase-db-push).

**Dừng, không push** nếu migration list/dry-run có `0001`–`0004`, báo lệch lịch sử, hoặc liệt kê file ngoài ba migration sau. Không dùng `--include-all`, `migration repair`, `db reset --linked` hay SQL editor trên production để chữa lệch lịch sử:

- `20260929233310_order_integrity.sql`
- `20260930074344_custom_cake_integrity.sql`
- `20260930074614_order_private_fields.sql`

Nhờ kỹ sư Supabase đối chiếu schema thực và `supabase_migrations.schema_migrations`, xác định baseline an toàn cho sandbox, rồi chạy dry-run lại. Tên migration cũ khác timestamp chuẩn; không đoán trạng thái đã áp dụng dựa vào tên file hoặc ghi chú trong SQL.

Khi danh sách staging đã được đối chiếu và chủ dự án chấp thuận **chỉ staging**, chạy:

```powershell
pnpm dlx supabase db push --linked
pnpm dlx supabase migration list --linked
```

Đọc toàn bộ kết quả; cần thấy đúng ba migration mới được áp dụng và không có migration nền nào chạy lại.

## 3. Kiểm thử trên staging

1. Cấu hình ứng dụng với env staging, khởi động lại process, xác nhận hostname project là staging trước test.
2. Chạy `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` và `pnpm exec playwright test --config playwright.qa.config.ts`.
3. Trên staging riêng, dùng dữ liệu giả và email sandbox để chạy `pnpm e2e`. Kiểm tra: checkout thành công; retry cùng idempotency key không tạo đơn hai lần; giá thay đổi yêu cầu khách xác nhận lại; hủy đơn trả đúng tồn kho một lần; custom cake quote/convert tạo đúng một đơn và giữ tùy chọn/ghi chú.
4. Kiểm tra anon không đọc được `order`/`order_item`; tài khoản A không đọc đơn của B; admin có thể xem và cập nhật đơn; logout thu hồi quyền. Thử rollback/restore bằng một bản staging có thể xóa.
5. Không cho staging gửi email thật, gọi cổng thanh toán thật hoặc dùng dữ liệu khách hàng production.

PGlite trong workspace đã thử transaction, retry, rollback và quyền RLS với schema giả lập; nó chưa chứng minh migration khớp schema/Auth/Storage thật hoặc khóa đồng thời trong PostgreSQL. Docker daemon hiện không chạy nên chưa thể tạo local Supabase đầy đủ ở đây.

## 4. Điều kiện trước production

- Chủ dự án xác nhận domain canonical và điền `NEXT_PUBLIC_SITE_URL` đúng; origin hiện cấu hình chưa được xác nhận là domain thương hiệu.
- Quyết định có chuyển ảnh tham khảo sang bucket private/signed URL không. Hiện bucket ảnh là public; không đổi Storage trước khi chốt ảnh cũ, quyền truy cập, hạn lưu và khả năng hiển thị đơn cũ.
- Chọn distributed rate limiter/WAF trước khi mở rộng nhiều instance; giới hạn hiện tại nằm trong bộ nhớ process.
- Lập backup production và thử restore vào staging. Xác nhận cách phát hành code cùng migration: source mới cần RPC mới, còn policy privacy phụ thuộc vào DAL mới. Có thể cần maintenance window ngắn để không tạo khoảng lệch giữa code/schema.
- Chủ dự án phải duyệt production rollout riêng. Trước đó không liên kết CLI với production, không `db push`, không chạy POST thử, và không promote deployment.

Sau khi staging đạt, kiểm tra deployment preview đã build từ đúng commit: trang listing phải có description; `/gio-hang`, `/thanh-toan`, `/tra-cuu-don-hang` phải trả `noindex`; chạy `node scripts/check-configured-site-readonly.mjs` để kiểm tra các trang/sitemap/header bằng GET/HEAD. Script này không thử checkout hay ghi dữ liệu.
