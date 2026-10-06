# bakery-store

Website bán bánh kem & bánh ngọt — Next.js 16 (App Router) + Supabase. Đặc tả đầy đủ ở
[`KE-HOACH-DU-AN.md`](./KE-HOACH-DU-AN.md).

**Cập nhật kết nối 06/10/2026:** dữ liệu và ảnh đã chuyển sang Supabase **Web-project**
(`jtizooyjnllostamffpp`). Các migration về giao dịch đơn hàng, trường riêng tư, ảnh bánh đặt
riêng và giới hạn yêu cầu đã được áp dụng trên dự án mới. Database cũ được giữ nguyên.
Xem [hướng dẫn cấu hình Supabase](docs/supabase-web-project.md).

Không chạy lại seed hoặc migration khởi tạo trên Web-project: đây là database dùng chung
với nhiều website. Những báo cáo bàn giao ngày 01/10 trong `docs/` là lịch sử kiểm tra;
blocker thiếu RPC đã được xử lý khi chuyển dự án. Chưa gửi email xác nhận hoặc tạo đơn
hàng thật để kiểm tra trong phiên chuyển dữ liệu này.

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

Sau bản sửa 30/09/2026, đổi `ADMIN_PASSWORD` hoặc `ADMIN_SESSION_SECRET` và khởi động
lại ứng dụng sẽ vô hiệu hóa các cookie admin đã cấp. Khóa ký phải dài ít nhất 32 ký tự.

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

Phiên kiểm tra bàn giao chỉ chạy local, không deploy. Có domain Vercel trong cấu hình,
nhưng chủ dự án cần xác nhận domain chính thức và môi trường dữ liệu trước phát hành.

### Runbook kỹ thuật trước bàn giao

1. Dùng Node.js và pnpm tương thích `package.json` (phiên kiểm chứng: Node 24.15.0,
   pnpm khai báo 11.5.1). Cài `pnpm install --frozen-lockfile` trên checkout sạch.
   Không dùng `pnpm seed` với database có dữ liệu thật.
2. Tạo `.env.local` từ `.env.local.example`; điền thông tin của **sandbox riêng**.
   Khi chia sẻ cấu hình, chỉ chia sẻ tên biến, không chia sẻ giá trị.
3. Chuẩn bị schema rồi chạy `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`.
   Chạy `pnpm exec next start -p 3100` để kiểm thử bản production local.
4. Chạy `pnpm exec playwright test --config playwright.qa.config.ts` cho bộ kiểm tra
   chỉ đọc/checkout giả lập. Bộ `pnpm e2e` đầy đủ có test ghi đơn, upload, CRUD và
   gửi email; **chỉ chạy khi đã cấu hình sandbox và dịch vụ email kiểm thử**.
   `node scripts/check-configured-site-readonly.mjs` chỉ gửi GET tới
   `NEXT_PUBLIC_SITE_URL`; không đăng nhập, submit form hay ghi dữ liệu. Dùng nó để
   kiểm tra HTTP/SEO/header của origin đã cấu hình.
5. Sau khi sandbox đạt và có quyết định phát hành, đưa cùng phiên bản code và env
   lên preview. Đặt `SITE_NOINDEX=true` ở staging ngoài Vercel; Vercel preview tự
   có noindex. Chạy lại mua hàng, bảo mật và SEO trên preview trước promote.
   Phiên này không thực hiện bước deploy/promote.

### Biến môi trường và mục đích

| Biến | Mục đích |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project dữ liệu/Auth/storage; public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Khóa public dùng với RLS, không phải service role |
| `SUPABASE_SERVICE_ROLE_KEY` | Server đọc/ghi đặc quyền; tuyệt đối không đưa vào browser |
| `ADMIN_PASSWORD` | Mật khẩu quản trị; đổi sẽ thu hồi các phiên admin cũ sau restart |
| `ADMIN_SESSION_SECRET` | Khóa ký cookie admin và quyền xem biên nhận; tối thiểu 32 ký tự |
| `RESEND_API_KEY` | Gửi thông báo; sandbox phải dùng tài khoản/địa chỉ kiểm thử |
| `EMAIL_FROM` | Người gửi thuộc domain đã xác minh với Resend |
| `NEXT_PUBLIC_SITE_URL` | Origin HTTPS chính thức cho canonical, OG, sitemap; cần xác nhận |
| `SITE_NOINDEX` | `true` để chặn index staging; chỉ tắt khi nội dung đã được duyệt |
| `VERCEL_ENV` | Vercel cung cấp; `preview` luôn noindex |
| `QA_BASE_URL` | Tùy chọn cho script kiểm tra; chỉ chấp nhận localhost/127.0.0.1 |

### Migration và dữ liệu

- Chỉ thay đổi `public.bakery` và các object có tiền tố `bakery_`; không đụng bảng
  của dự án khác trong cùng Supabase project.
- `0001` giả định bảng `bakery` đã có `id bigint identity primary key` và
  `created_at timestamptz default now()`. Với sandbox trống hoàn toàn, tạo bảng nền
  đó trước, rồi chạy `0001` → `0002` → `0003` → `0004`. Supabase cần schema Auth,
  Storage và extension `unaccent`; PGlite test không thay thế toàn bộ môi trường này.
- Ba migration cần duyệt/thử trước phát hành:
  `20260929233310_order_integrity.sql` (có từ đầu phiên),
  `20260930074344_custom_cake_integrity.sql`,
  `20260930074614_order_private_fields.sql`.
- Migration order integrity tạo RPC commit nguyên tử và sửa trạng thái đơn; migration
  custom cake tạo RPC báo giá/chuyển đơn chống lặp. Migration privacy chặn đọc trực tiếp
  JSONB đơn hàng bằng anon/authenticated; lịch sử/biên nhận đi qua DAL server kiểm tra
  `getUser()` + ownership và bỏ trường nội bộ. Đây là thay đổi bảo mật của Data API;
  cần kiểm tra các consumer bên ngoài nếu có. Chưa phát hiện consumer đó trong repo.
- Triển khai code DAL trước, sau đó migration privacy. Với RPC mới, chạy migration
  trước khi mở checkout/admin cho người dùng. Không bật checkout giữa hai bước.
- Không dùng `supabase db push` mù trên project dùng chung. Đối chiếu migration history
  và backup trước; chạy SQL đã duyệt trong transaction, dừng ngay khi lỗi.
  Không có migration nào của phiên này được chạy lên Supabase từ xa.

Test SQL cô lập hiện dùng PGlite trong thư mục công cụ bị Git ignore:

```powershell
npm install --prefix .tmp-quality-tools --no-save --package-lock=false @electric-sql/pglite@0.5.8
node scripts/test-order-database.mjs
```

Test này không kết nối Supabase, không gửi email. Nó kiểm tra transaction, rollback,
idempotency, quyền RPC và policy bảo vệ dữ liệu. Cần kiểm tra bổ sung hai kết nối
PostgreSQL đồng thời trong sandbox; PGlite chỉ có một kết nối.

### Vận hành đơn hàng và thông báo

- COD và chuyển khoản VietQR đều tạo đơn `unpaid`. VietQR là chỉ dẫn chuyển khoản,
  không phải cổng thanh toán tự xác nhận. Admin chỉ đánh dấu đã thanh toán sau đối soát.
- Trạng thái đi tiến theo `pending → confirmed → baking → delivering → completed`
  (code hiện cho phép bỏ qua bước trung gian); đơn hoàn tất/hủy không mở lại. Hủy chỉ
  hoàn đúng phần tồn kho đã giữ, đúng một lần. Chưa có luồng hoàn tiền tự động.
- Yêu cầu bánh riêng phải được báo giá trước khi chuyển. Transaction giữ liên kết
  `order_id`; retry không tạo đơn thứ hai. Các yêu cầu `accepted` cũ chưa có liên kết
  phải đối chiếu thủ công, không tự chuyển lại.
- Báo giá được lưu nhưng email lỗi sẽ hiện cảnh báo riêng. Đơn checkout đã commit
  vẫn tồn tại khi email lỗi; tra trong admin trước khi thử tạo đơn mới.
- Giá/coupon/tồn kho được server kiểm tra lại. Khi checkout báo giá thay đổi, khách
  phải xem tổng mới rồi tự xác nhận lại. Không tự gửi lại thay khách.
- Chưa có hàng đợi email bền vững hay retry tự động. Theo dõi mã log
  `checkout_failed`, `notification_failed`, `provider_rejected`, `delivery_failed`,
  `upload_failed`; không thêm PII hoặc request body vào log.

### Backup, restore và rollback

1. Trước migration/release, lưu snapshot/backup database theo tính năng Supabase
   của gói đang dùng, xuất riêng schema/dữ liệu bakery nếu dùng project chung, và
   sao lưu file bucket `bakery`. Backup database không đồng nghĩa backup ảnh Storage.
2. Lưu commit/artifact build và tên biến cấu hình tương ứng trong nơi kiểm soát truy cập.
   Không lưu secrets trong Git hay tài liệu bàn giao.
3. Thử restore vào project sandbox riêng; đối chiếu số sản phẩm/đơn, tổng tiền mẫu,
   quyền đọc, ảnh và đăng nhập. Khả năng restore chưa được thực thi trong phiên này.
4. Rollback ứng dụng về bản đã kiểm chứng tương thích RPC/privacy. Không rollback DAL
   về bản đọc trực tiếp bằng anon sau khi đã áp policy privacy; không mở lại lỗ hổng
   để chữa nhanh. Các RPC bổ sung có thể giữ nguyên, không cần drop dữ liệu.
5. Nếu dữ liệu hỏng, tạm dừng nhận đơn và phục hồi từ backup đã kiểm chứng; đối chiếu
   các đơn nhận sau thời điểm backup trước khi mở lại. Không restore toàn project
   dùng chung nếu chưa có kế hoạch bảo toàn các ứng dụng khác.

### Kiểm tra sau deploy và chẩn đoán

| Hiện tượng | Kiểm tra trước |
|---|---|
| Checkout báo lỗi dịch vụ | RPC `bakery_commit_order`, env service role, quyền execute, migration |
| Không cập nhật trạng thái đơn | RPC `bakery_update_order`, trạng thái nguồn/đích hợp lệ |
| Không chuyển được bánh riêng | RPC mới, yêu cầu ở `quoted`, báo giá/settings chưa đổi giữa lúc xử lý |
| Mất phiên khách sau khi hết hạn | Proxy refresh, cookie HTTPS/domain, Auth redirect config |
| Admin bị khóa tạm | Đợi cửa sổ 15 phút; không reset rate-limit để thử mật khẩu hàng loạt |
| Không có QR | Kiểm tra đủ bank code, account number, account name trong admin |
| Không nhận email | Domain Resend/người gửi, kết quả provider; kiểm tra đơn trước retry |
| Không thấy đơn qua REST public | Hành vi chủ ý sau privacy migration; dùng UI đã xác thực |
| Preview xuất hiện trên tìm kiếm | Kiểm tra response `X-Robots-Tag`, `SITE_NOINDEX`, sitemap rỗng |

Sau deploy kiểm tra trang chủ/danh mục/sản phẩm cả VI/EN, 404, giỏ reload, checkout
bằng đơn sandbox được phép, quyền xem biên nhận, logout, ảnh, lỗi console/network,
canonical/sitemap/robots và giao diện mobile. Chạy `/seo page` và `/seo technical`
trên URL preview khi có; không tự chạy full audit tốn quota.

### Chủ tiệm cần xác nhận trước production

- Domain, thị trường/ngôn ngữ, thông tin thương hiệu/liên hệ, ảnh bánh thật, đánh giá
  thật; loại bỏ nội dung seed khỏi schema và giao diện trước index.
- Phí/vùng giao hàng, giờ chốt, thời gian chuẩn bị từng bánh, quy tắc hủy/hoàn tiền,
  thông tin dị ứng và bảo quản. Không suy ra các quy tắc này từ nội dung mẫu.
- Tài khoản ngân hàng nhận tiền, Resend sender và Supabase Auth email confirmation/
  redirect URL; bộ tài khoản test để kiểm chứng quyền A/B trên sandbox.
- Hosting và cơ chế rate-limit dùng chung giữa các instance. Rate-limit trong code
  hiện là bộ nhớ tiến trình; cần lớp proxy/WAF hoặc store bền vững trước public launch.
- Ảnh tham khảo khách tải lên hiện ở bucket public: cần chốt chính sách riêng tư/lưu
  giữ và thiết kế signed URL nếu ảnh cần bảo mật; chưa đổi dữ liệu/storage từ xa.
