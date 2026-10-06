# Cấu hình Supabase Web-project

Ngày cập nhật: 06/10/2026.

## Kết nối

- URL: `https://jtizooyjnllostamffpp.supabase.co`.
- Dữ liệu Bakery nằm trong bảng `public.bakery`, chia theo trường `type`.
- Ảnh công khai nằm trong bucket `bakery`; ảnh khách gửi cho bánh đặt riêng nằm trong
  bucket riêng tư `bakery-custom-cake-private`.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` dùng khóa của Web-project.
- `SUPABASE_SERVICE_ROLE_KEY` cũng phải thuộc Web-project, chỉ dùng trên máy chủ.
- Mật khẩu và khóa ký phiên của trang quản trị Bakery được giữ nguyên.

Database này dùng chung với các website khác. Không chạy `0001_init.sql`, seed, reset
database hay đổi tên bảng ngoài phạm vi Bakery trên dự án này.

## Xác nhận tài khoản khách hàng

`NEXT_PUBLIC_SITE_URL` phải là địa chỉ chính thức của Bakery. Trong Supabase → Authentication
→ URL Configuration → Redirect URLs, thêm:

```text
https://bakery-shop-gray.vercel.app/api/auth/callback
```

Giữ các URL và Site URL của những website khác. `signUp` truyền `emailRedirectTo` riêng
cho Bakery; `/api/auth/callback` xác minh mã với Supabase, lưu cookie phiên và chuyển về
`/tai-khoan`. Mã thiếu, quá dài hoặc không hợp lệ chuyển về trang đăng nhập. Không chấp
nhận URL chuyển hướng do người dùng gửi lên.

Khi phát triển cục bộ, cấu hình `NEXT_PUBLIC_SITE_URL` theo cổng đang chạy và thêm đường
dẫn `/api/auth/callback` tương ứng vào allowlist. Luồng PKCE cần mở liên kết xác nhận
trong trình duyệt đã đăng ký để có cookie xác minh.

## Dữ liệu và quyền

- Khách đọc nội dung công khai qua RLS.
- Đơn hàng, hồ sơ khách và yêu cầu bánh riêng không được đọc công khai.
- Ghi dữ liệu dùng service role sau khi máy chủ kiểm tra người dùng hoặc quyền quản trị.
- Hồ sơ khách được tạo sau khi tài khoản đã xác minh; hồ sơ có sẵn được giữ lại.
- Các phiên Supabase cũ cần đăng nhập lại sau khi đổi dự án.

Đã kiểm tra build, kiểu dữ liệu và bài kiểm tra tự động. Việc gửi email xác nhận thật
và đặt đơn hàng thật không nằm trong các kiểm tra đã thực hiện.
