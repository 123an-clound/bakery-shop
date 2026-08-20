# bakery-store

Website bán bánh kem & bánh ngọt — Next.js 16 (App Router) + Supabase. Đặc tả đầy đủ ở
[`KE-HOACH-DU-AN.md`](./KE-HOACH-DU-AN.md).

Có hai phần trong file này:

- **[Hướng dẫn cho chủ tiệm](#hướng-dẫn-cho-chủ-tiệm-không-cần-biết-code)** — dành cho người
  vận hành, không cần biết lập trình.
- **[Hướng dẫn kỹ thuật](#hướng-dẫn-kỹ-thuật)** — dành cho lập trình viên chạy/bảo trì dự án.

---

## Hướng dẫn cho chủ tiệm (không cần biết code)

Toàn bộ nội dung website (sản phẩm, danh mục, ảnh, màu sắc, thông tin tiệm, tài khoản ngân
hàng...) đều chỉnh sửa được qua **trang quản trị**, không cần sửa code. Sau khi đăng nhập,
truy cập `/admin` (ví dụ `http://localhost:3000/admin` khi chạy ở máy, hoặc tên miền thật của
tiệm sau này).

### Đăng nhập trang quản trị

1. Vào `/admin` — trang sẽ hỏi mật khẩu.
2. Nhập mật khẩu admin (do người kỹ thuật cấp lúc bàn giao, xem mục "Đổi mật khẩu" bên dưới nếu
   muốn đổi).
3. Nếu nhập sai **6 lần liên tiếp**, hệ thống sẽ tạm khoá đăng nhập một lúc để chống dò mật khẩu
   — đợi vài phút rồi thử lại.

### Đổi mật khẩu đăng nhập admin

Mật khẩu admin nằm trong file cấu hình `.env.local`, biến `ADMIN_PASSWORD` — **không đổi được
trực tiếp trên trang web** (đây là lựa chọn kỹ thuật để bảo mật đơn giản, không có "tài khoản"
theo nghĩa thông thường).

1. Mở file `.env.local` ở thư mục gốc dự án bằng Notepad (hoặc bất kỳ trình soạn thảo văn bản
   nào).
2. Tìm dòng `ADMIN_PASSWORD=...`, sửa thành mật khẩu mới.
3. Lưu file, sau đó khởi động lại website (tắt rồi chạy lại `pnpm start`, hoặc nhờ người kỹ
   thuật nếu đang chạy trên máy chủ thật/Vercel).
4. Đăng nhập lại `/admin` bằng mật khẩu mới.

> Chọn mật khẩu đủ dài và khó đoán — đây là "chìa khoá" duy nhất bảo vệ toàn bộ trang quản trị.

### Thêm / sửa sản phẩm

1. Vào `/admin/san-pham` → bấm **"Thêm sản phẩm"** (hoặc bấm vào một sản phẩm có sẵn để sửa).
2. Điền tên, mô tả, giá, danh mục, chọn ảnh (xem mục "Thay ảnh" bên dưới).
3. Nếu bánh có nhiều lựa chọn (size, vị...), thêm ở phần "Biến thể" — mỗi lựa chọn có thể cộng
   thêm/bớt tiền so với giá gốc.
4. Bấm **"Xuất bản"** để hiển thị ngay cho khách; hoặc lưu nháp nếu chưa muốn hiển thị.
5. Sản phẩm mới hiện ngay trên trang khách, không cần chờ hay sửa code gì thêm.

Danh mục sản phẩm quản lý tương tự ở `/admin/danh-muc`.

### Thay ảnh (sản phẩm, banner, logo, ảnh nền trang chủ...)

Mọi chỗ có ảnh trong trang quản trị đều dùng chung một khung tải ảnh:

1. Bấm vào khung ảnh (hoặc nút "Tải ảnh lên").
2. Chọn ảnh từ máy tính — hỗ trợ JPG, PNG, WebP, AVIF.
3. Đợi ảnh tải xong (thanh xoay tròn), ảnh sẽ tự hiện ra thay cho ảnh cũ.
4. Nhớ bấm **"Lưu thay đổi"** (hoặc "Xuất bản") ở trang đó để áp dụng ảnh mới cho khách.

Vị trí thay ảnh thường dùng:
- Ảnh sản phẩm: `/admin/san-pham` → mở sản phẩm.
- Logo, favicon, ảnh nền trang chủ (Hero): `/admin/giao-dien` (Theme Editor).
- Banner trang chủ: `/admin/banner`.
- Ảnh bìa bài viết: `/admin/bai-viet`.

> Dữ liệu mẫu ban đầu dùng **ảnh chờ (placeholder)** từ Lorem Picsum — không phải ảnh bánh thật
> của tiệm. Cần thay hết bằng ảnh thật trước khi vận hành chính thức.

### Đổi tài khoản ngân hàng (nhận chuyển khoản QR)

1. Vào `/admin/cai-dat`.
2. Ở phần thông tin ngân hàng: chọn **tên ngân hàng**, nhập **số tài khoản**, **tên chủ tài
   khoản**. Có thể đặt thêm "tiền tố nội dung chuyển khoản" (ví dụ để dễ nhận diện đơn hàng khi
   khách chuyển khoản).
3. Bấm **"Lưu thay đổi"**.
4. Mã QR VietQR ở trang xác nhận đơn hàng (khi khách chọn thanh toán chuyển khoản) sẽ tự cập
   nhật theo thông tin mới — không cần sửa gì thêm.

Cùng trang `/admin/cai-dat` còn có: hotline, địa chỉ, giờ mở cửa, mạng xã hội, phí vận chuyển,
ngưỡng miễn phí ship, email nhận thông báo đơn hàng mới, và thông tin SEO mặc định (tiêu đề/mô
tả khi chia sẻ link lên Facebook/Zalo...).

### Đổi màu sắc, sắp xếp/ẩn-hiện các mục trên trang chủ

Vào `/admin/giao-dien` (Theme Editor):

- **Bảng màu**: chọn màu có sẵn hoặc tự chọn màu riêng — có xem trước ngay bên phải trước khi
  lưu.
- **Thứ tự các mục trang chủ**: kéo-thả để đổi thứ tự (ví dụ đưa "Sản phẩm nổi bật" lên trên),
  dùng công tắc bật/tắt để ẩn hẳn một mục (ví dụ tạm ẩn "Tin tức" nếu chưa có bài viết nào).
- Sau khi bấm **"Lưu thay đổi"**, trang khách cập nhật ngay — không cần sửa code, không cần
  chờ đợi.

### Các việc thường làm khác

| Muốn làm gì | Vào đâu |
|---|---|
| Duyệt đánh giá của khách trước khi hiển thị công khai | `/admin/danh-gia` |
| Xem & xử lý đơn hàng, đổi trạng thái, in hoá đơn | `/admin/don-hang` |
| Xem & báo giá yêu cầu đặt bánh riêng | `/admin/banh-dat-rieng` |
| Tạo mã giảm giá | `/admin/ma-giam-gia` |
| Sửa các trang tĩnh (giới thiệu, điều khoản...) | `/admin/trang-tinh` |
| Xem danh sách khách hàng | `/admin/khach-hang` |

---

## Hướng dẫn kỹ thuật

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
