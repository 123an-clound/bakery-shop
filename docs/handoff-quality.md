# Báo cáo chất lượng trước bàn giao

Ngày kiểm tra source/lab: 30-09-2026. Xác nhận production và GET-only smoke: 01-10-2026. Chủ dự án xác nhận Supabase trong `.env.local` là production. Môi trường này chỉ được kiểm tra bằng các phép đọc schema/quyền; không ghi dữ liệu, chạy migration hay tạo đơn. Giá trị bí mật không được ghi vào báo cáo.

## Kết luận

**Chưa đủ điều kiện bàn giao production.** P0 còn mở: Supabase production không có các RPC mà source trong workspace hiện phụ thuộc vào. Nếu deploy source này trước migration, checkout và một số cập nhật đơn sẽ lỗi. Tôi chưa thử luồng ghi trên bản đang chạy production; trạng thái checkout live vì vậy chưa được xác minh. Các migration đã được viết và thử trên PGlite cô lập, nhưng chưa áp dụng production. Chưa có sandbox riêng để xác minh tương thích; cũng cần xác nhận domain chính thức, chính sách ảnh tham khảo riêng tư và giới hạn vận hành.

## Cập nhật sau kiểm tra Vercel Preview

Commit `dd44735` làm Vercel Preview build thất bại khi thu thập cấu hình `/robots.txt`: Preview có `NODE_ENV=production` nhưng không khai báo `NEXT_PUBLIC_SITE_URL`. Nguyên nhân là helper SEO áp cùng yêu cầu canonical URL cho Preview và Production. Source đã được sửa để chỉ dùng hostname do Vercel cấp (`VERCEL_URL`) trong môi trường Preview; production vẫn bắt buộc `NEXT_PUBLIC_SITE_URL`, và Preview tiếp tục noindex. Regression tests, lint, typecheck và build theo cấu hình Preview đều đạt; Vercel đã build commit `e1f3569` thành trạng thái Ready. Tuy nhiên, GET-only smoke trên Preview mới trả HTTP 500 ở storefront vì Preview chưa được cấp `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`; đây là blocker cấu hình môi trường, chưa phải xác minh runtime pass. Cần điền credentials của sandbox riêng vào Preview rồi chạy lại smoke; không sao chép production secrets sang Preview.

## Tối ưu source không cần staging (02-10-2026)

- Nâng Next.js từ `16.3.5` lên `16.3.8` sau khi `pnpm audit` báo lỗ hổng Critical trong dependency và Next.js công bố bản bảo mật 16.3.8. Bản mới khắc phục đợt bảo mật ngày 30-09-2026; `pnpm audit` đầy đủ và `pnpm audit --prod` hiện không báo vulnerability. Source không dùng `next/og` `ImageResponse`; dù vậy Next.js cũng vá các advisory khác trong bản phát hành đó.
- Bài blog gần đây và bài liên quan trước đó tải toàn bộ danh sách bài rồi cắt còn ba. Truy vấn gần đây giờ áp `.limit()` trong Supabase; trang chi tiết chỉ lấy ba bài mới nhất, loại bài hiện tại ngay ở query. Hành vi hiển thị/thứ tự giữ nguyên; chưa có phép đo thời gian trước/sau riêng cho truy vấn này.
- Tắt `X-Powered-By` qua `poweredByHeader: false`. Build local xác nhận header này không còn được gửi.
- Local production build và GET smoke: các trang `/san-pham`, `/gio-hang`, `/thanh-toan`, `/tra-cuu-don-hang` đều HTTP 200; trang sản phẩm có meta description và ba trang riêng tư/giao dịch có `noindex`. Các thay đổi này chưa được đưa lên production.
- Không có số đo hiệu năng sau thay đổi hợp lệ: lần chạy lab mới bị tranh chấp tài nguyên với browser suite và đã dừng; không dùng các số đó làm kết quả. Báo cáo lab hiện có phía dưới vẫn là đường cơ sở trước đó. Chưa có dữ liệu CrUX/RUM.

## Phát hiện và xử lý

| Mức | Bằng chứng / nguyên nhân | Xử lý và vị trí | Xác minh / trạng thái |
|---|---|---|---|
| P0 mở | Probe REST chỉ đọc trả về OpenAPI 200 nhưng thiếu `bakery_commit_order`, `bakery_update_order`, `bakery_quote_custom_cake`, `bakery_convert_custom_cake`. Checkout và admin gọi RPC nên không tương thích schema đang cấu hình. | Tạo migration cho integrity đơn, chuyển custom cake theo transaction và thu hẹp quyền xem trường riêng tư: `supabase/migrations/20260929233310_order_integrity.sql`, `20260930074344_custom_cake_integrity.sql`, `20260930074614_order_private_fields.sql`. Không chạy trên database thật. | PGlite kiểm tra schema mẫu/các quyền; Supabase từ chối hiển thị đơn cho anon (200 dòng) và kiểm kê RPC không đọc dữ liệu đơn. Cần review schema và chạy ở sandbox được xác nhận, rồi kiểm thử staging trước production. |
| P0 đã giảm thiểu, còn phụ thuộc migration | Chính sách RLS cũ cho phép khách đăng nhập đọc nguyên JSONB đơn, trong đó có `internal_note`, request hash và reservation tồn kho. | Migration `20260930074614_order_private_fields.sql`; DAO xác thực user server-side và giới hạn đơn theo `user_id` tại `lib/bakery/orders.ts`, `lib/auth/order-access.ts`. | PGlite tái hiện đường đọc cũ và xác nhận policy mới chặn truy cập trực tiếp, catalog công khai vẫn đọc được. Chưa có hiệu lực trên Supabase đang chạy cho đến khi migration được áp dụng. |
| P0 đã sửa trong source, xác minh sandbox | Tạo đơn custom cake trước đây ghi đơn và trạng thái quote bằng hai thao tác độc lập, không idempotent: có thể sinh đơn trùng hoặc quote mồ côi. | RPC quote/convert nguyên tử, khóa bản ghi, chống retry trùng, kiểm tra giá/cấu hình và đưa tùy chọn custom vào order item; action/UI xử lý thông báo lỗi email sau khi lưu tại `lib/actions/admin/custom-cake.ts`. | Migration chạy qua các kịch bản thành công, retry, giá/cấu hình đổi, rollback và quyền gọi trên PGlite. E2E dùng giả lập; không tạo đơn thật hay gửi email thật. |
| P1 đã sửa | Token đăng nhập admin không bị thu hồi khi đổi mật khẩu; rate limiter được tiêu thụ trước parse JSON nhưng có race giữa peek và consume. | Ràng buộc chữ ký session theo mật khẩu và secret, giới hạn độ dài/định dạng, consume quota trước parse và giới hạn body tại `lib/auth/admin-session.ts`, `app/api/admin/login/route.ts`. | Unit tests session/login/request-body; lint, typecheck và unit suite. |
| P1 đã sửa | Giá giỏ có thể lệch giá sale ở server; ID dòng giỏ có thể đụng nhau khi tên option chứa dấu phân cách. | Đồng bộ cách chọn `sale_price`; encode key option trong `lib/bakery/order-pricing.ts`, `lib/store/cart.ts`. Kiểm tra phân trang và 404 dữ liệu ngoài phạm vi ở product/category. | Unit regressions; E2E pagination/canonical và checkout thay đổi giá. |
| P1 đã sửa | Các route giỏ và checkout công khai dữ liệu trang dù phụ thuộc người dùng; policy order bị lộ trường nội bộ như trên. | Giới hạn đọc đơn, bỏ trường nội bộ trong DTO và dùng receipt access có kiểm soát. Xác thực đơn hàng ở server, client key không được coi là bằng chứng giá/thanh toán. | Unit/PGlite; checkout E2E mock request. Thanh toán/provider webhook thật không có trong môi trường kiểm chứng. |
| P1 mở | Rate limit admin/API hiện là bộ nhớ từng process; khi scale-out hoặc khởi động lại có thể bị reset. Upload ảnh bánh tham khảo đi qua luồng bucket công khai hiện hữu; ảnh sự kiện cá nhân có thể bị xem công khai. | Không tự chuyển hạ tầng rate-limit hay bucket vì cần quyết định vận hành/quyền riêng tư và vòng đời URL. | Cần shared limiter/WAF và xác nhận bucket private/signed URLs trước production. |
| P1 đã sửa | Supabase SSR refresh được giả định có trong proxy nhưng chưa tồn tại, có thể làm session hết hạn giữa điều hướng. | Bổ sung refresh có điều kiện và truyền cookie/header đúng vào `proxy.ts`, `lib/supabase/refresh-session.ts`. | Unit mock refresh/rewrite; browser regression suite. Chưa kiểm thử token/session trên auth server staging. |
| P1 đã cải thiện, giới hạn đo | Model 3D 1.3M vertex (~3.2 MB asset) được tải trong giai đoạn khởi tạo trang. | Hoãn mount đến sau `window.load` và lúc idle, có fallback timer/hủy listener tại `components/scene/scene-root.tsx`. | Đo lab cùng máy trình duyệt và profile trước/sau bên dưới. Long task trong script đo vẫn cao; đây không phải CWV thực tế. |
| P2 đã sửa | Trang sản phẩm/danh mục có metadata mô tả thiếu sau khi Next gộp metadata; trang phân trang ngoài phạm vi không thống nhất status. | Hợp nhất metadata locale/site từ `lib/seo/metadata.ts`; 404 phân trang không hợp lệ. | Unit metadata và smoke HTTP; sitemap 82 URL unique, canonical URL trả 200, invalid paging 404/noindex. |
| P2 cần xác nhận | `NEXT_PUBLIC_SITE_URL` hiện dùng `https://bakery-shop-gray.vercel.app`; domain này chưa được chủ dự án xác nhận là canonical. Thông tin liên hệ/schema/giờ mở cửa cũng cần so lại với dữ liệu pháp lý thật. | Không thay URL hiện tại khi chưa có domain chính thức. Preview có noindex; robots/sitemap và schema storefront được rà. | Metadata/JSON-LD khớp trang thử; Search Console, index thực tế, rich result test và dữ liệu crawl production chưa truy cập. |
| P2 mở trên deployment | GET-only smoke tới origin đang cấu hình (`bakery-shop-gray.vercel.app`; chưa xác nhận domain thương hiệu) thấy meta description vắng ở `/san-pham`; robots meta cũng vắng trên `/gio-hang`, `/thanh-toan`, `/tra-cuu-don-hang`, trong khi source hiện tại tạo description cho danh mục và `noindex` cho trang chuyển đổi/tracking. | Không deploy vì yêu cầu hiện tại cấm production deploy. Đưa source đã sửa qua sandbox/staging rồi quy trình release được chủ dự án phê duyệt. | 9 route/endpoint trả 200; 0 lỗi runtime; 0 ảnh hỏng ở 7 trang HTML. Sitemap live 42/42 URL duy nhất, same-origin và GET 2xx; robots có sitemap reference và không block toàn site. |

## Hiệu năng lab trước/sau

30 phép đo: 5 route × desktop/mobile × 3 lần, Chromium 151, Next production build trên localhost:3100, cache tắt. Desktop 1440×900, không throttle; mobile 390×844, CPU 4×, độ trễ 40 ms, download 10 Mbps. Báo cáo median LCP và các metric ước lượng do Playwright script ghi; không có RUM/CrUX nên đây không phải Core Web Vitals p75 thực tế. Script chờ 4 giây sau load; tải 3D trễ vẫn có thể ảnh hưởng phép đo.

| Route | LCP desktop trước → sau | LCP mobile trước → sau | CLS desktop/mobile trước → sau |
|---|---:|---:|---:|
| Trang chủ | 236 → 412 ms | 576 → 592 ms | 0 / 0 → 0 / 0 |
| Danh mục | 488 → 508 ms | 804 → 780 ms | 0 / 0 → 0 / 0 |
| Chi tiết bánh | 2872 → 2368 ms | 2008 → 2088 ms | 0 / 0 → 0 / 0 |
| Giỏ hàng | 336 → 368 ms | 996 → 1092 ms | desktop 0.0433 → 0.0433; mobile 0 → 0 |
| Checkout | 316 → 300 ms | 1052 → 1396 ms | desktop 0.0112 → 0.0169; mobile 0 → 0 |

So sánh cho thấy LCP desktop trang chi tiết giảm khoảng 504 ms (17.5%); các trang còn lại dao động và checkout/mobile xấu hơn trong mẫu này. Không tuyên bố đã đạt CWV. Tổng transfer trên các trang mẫu khoảng 3.2–3.5 MB, phần lớn là scene/image; JavaScript khoảng 319–646 KB mỗi route. Việc hoãn scene chưa loại bỏ được long task ~3.2–3.7 giây mà script ghi nhận. Cần chạy lại với cache/cold-vs-warm được tách rõ và xác minh asset network waterfall khi tối ưu vòng tiếp theo.

## Kiểm thử và kiểm tra

- Unit: `pnpm test` — 129 tests / 22 file đạt.
- Browser: `pnpm exec playwright test --config playwright.qa.config.ts` — 97 đạt; responsive widths, readable contrast, navigation, safe checkout retries/price-change behavior, và reduced-motion/3D flows. Checkout đã chặn/mô phỏng side-effect; không ghi đơn thật.
- Database: `node scripts/test-order-database.mjs` — PGlite chạy migration trên schema thử, transaction/idempotency/rollback/RLS privacy; không xác minh PostgreSQL nhiều session/tranh chấp đồng thời.
- Smoke browser: 12 public pages, admin routes, sitemap; public routes 200, admin export anonymous 401, logout thu hồi quyền. Không có JS exception trong các tuyến đã kiểm tra. Local Supabase RPC thiếu như P0 phía trên.
- Website origin đang cấu hình được kiểm tra riêng bằng `scripts/check-configured-site-readonly.mjs` (chỉ GET/HEAD, không đăng nhập hay submit): 9 route/endpoint 200, 42 URL sitemap GET 2xx, không có runtime exception. HSTS, CSP, X-Frame-Options và Referrer-Policy hiện được gửi. Deployment thực tế còn thiếu description ở product listing và noindex ở 3 trang chuyển đổi/tracking; thay đổi source chưa được deploy.
- `pnpm audit` và `pnpm audit --prod` sau khi cập nhật Next.js lên 16.3.8: không có vulnerability đã biết trong dependency tree.
- Secret scan giới hạn exact current env values trong file tracked/bundle và reachable history blobs ≤2 MB: không tìm thấy khớp. Đây không phải quét lịch sử đầy đủ.
- Chưa xác minh: performance RUM/CrUX, Search Console/organic, production auth/email/payment webhook, migration trên Supabase thật, backup/restore thực tế, và distributed rate limit. `pnpm e2e` mặc định chưa chạy để tránh tạo mutation vào Supabase cấu hình; suite read-only/mock đã dùng thay thế. Supabase CLI chưa cài, `supabase/config.toml` chưa có và Docker daemon không chạy; xem hướng dẫn mở staging trong `docs/production-unblock-checklist.md`.

## Giả định và điều kiện trước production

- Quy tắc giá/giao hàng giữ theo dữ liệu và logic hiện tại; không thêm chính sách thời điểm nhận bánh, khu vực hay tồn kho.
- Xác nhận domain canonical, locale/thị trường, dữ liệu liên hệ/giờ mở cửa/schema và việc Vercel Supabase hiện tại là sandbox hay có dữ liệu khách thật.
- Review ba migration trên bản sao backup/sandbox trước, xác nhận consumer ngoài repo không dựa vào quyền đọc trực tiếp `orders/order_items`, chạy smoke checkout sandbox và restore rehearsal. Không có migration nào được áp dụng trong đợt kiểm tra này.
- Chủ dự án chọn phương án lưu ảnh tham khảo riêng tư và rate limiting dùng chung trước khi mở công khai.

## Cập nhật kiểm chứng 02-10-2026

Phần này cập nhật kết quả của đợt tối ưu mới; kết luận production và các blocker trong báo cáo phía trên vẫn còn hiệu lực.

### Thay đổi

- Danh mục trên điện thoại giữ tìm kiếm hiển thị, gom bộ lọc vào disclosure có thể thao tác bằng bàn phím.
- WebGL/3D chỉ mount ở trang chủ; route khác dùng poster tĩnh. `prefers-reduced-motion` vẫn tắt canvas.
- Các thao tác admin tạo/sửa/xóa sản phẩm, danh mục và nội dung biên tập làm mới `/sitemap.xml` cùng tag nội dung. Thêm unit test cho invalidation và lỗi ghi.
- E2E tìm kiếm dùng tên sản phẩm thực từ dữ liệu thay cho tên cố định.

### Performance lab trước/sau

30 phép đo mỗi lượt: 5 route × desktop/mobile × 3 lần; Chromium 151; production build local; cache tắt. Desktop 1440×900 native; mobile 390×844, CPU 4×, latency 40 ms, download 10 Mbps. Median 3 lần. Đây là số đo lab, không phải RUM/CrUX hay CWV p75.

| Trang / thiết bị | LCP trước → sau | Transfer KB trước → sau | JS KB trước → sau | Long task ms trước → sau |
|---|---:|---:|---:|---:|
| Trang chủ desktop | 612 → 248 | 3435 → 3435 | 623 → 623 | 3768 → 3735 |
| Danh mục desktop | 532 → 492 | 3287 → 1003 | 589 → 311 | 3685 → 0 |
| Chi tiết bánh desktop | 2952 → 996 | 3364 → 1078 | 631 → 354 | 3723 → 0 |
| Giỏ hàng desktop | 412 → 488 | 911 → 911 | 311 → 311 | 0 → 0 |
| Checkout desktop | 368 → 420 | 935 → 935 | 324 → 324 | 0 → 0 |
| Trang chủ mobile | 688 → 752 | 3287 → 3287 | 623 → 623 | 2526 → 2176 |
| Danh mục mobile | 828 → 824 | 3123 → 838 | 589 → 311 | 2963 → 700 |
| Chi tiết bánh mobile | 2412 → 3204 | 3187 → 902 | 631 → 354 | 2820 → 950 |
| Giỏ hàng mobile | 1080 → 1076 | 742 → 742 | 311 → 311 | 101 → 53 |
| Checkout mobile | 1540 → 1168 | 770 → 770 | 324 → 324 | 505 → 176 |

Trang chủ vẫn khoảng 3.4 MB và có long task >2 giây trong mobile lab do giữ hero 3D. Trang chi tiết mobile có LCP xấu/dao động hơn dù transfer giảm khoảng 72%; LCP là ảnh sản phẩm từ nguồn ảnh placeholder bên ngoài. Cần ảnh bánh thật và đánh giá CDN trước khi mở bán. Không tuyên bố đã đạt CWV.

### Kiểm tra và cổng nghiệm thu

- `pnpm test`: 134/134 test, 23 file đạt. `pnpm typecheck`, `pnpm lint`, `pnpm build`, `git diff --check` đạt.
- Browser: `pnpm exec playwright test --config playwright.qa.config.ts`: 98/98 đạt trong 5,4 phút; bao gồm luồng catalog, checkout mock, admin smoke, keyboard, axe, responsive, reduced motion và scene. Không tạo đơn/thanh toán thật.
- `pnpm audit --prod`: không phát hiện lỗ hổng đã biết.
- DESIGN: PASS có điều kiện về bố cục; FAIL nội dung ảnh sản phẩm do ảnh placeholder phong cảnh.
- MOTION: PASS các kiểm tra reduced-motion và chuyển route; 3D chỉ ở trang chủ.
- ACCESSIBILITY: PASS axe không có lỗi serious/critical trên trang đã test, keyboard smoke và viewport 360–1920; chưa phải audit WCAG đầy đủ với assistive technology.
- DATA SYNC: CHƯA XÁC MINH qua hai phiên Supabase thật; test invalidation dùng mock.
- LOGIC: FAIL điều kiện production: 4 RPC mà source cần chưa có trên Supabase đang cấu hình. Checkout E2E chỉ mock; migration chưa chạy.
- SECURITY: CHƯA ĐẠT production gate: ảnh tham khảo dùng bucket công khai, rate limit là memory từng process. Cần quyết định ảnh private/signed URL và shared limiter/WAF. Secret scan trước chỉ giới hạn tracked/bundle/current env/reachable blob nhỏ.
- PERFORMANCE: Đã đo lab theo bảng; CHƯA XÁC MINH field CWV/INP. Trang chủ và ảnh chi tiết mobile còn rủi ro.
- SEO: Source có metadata/robots/sitemap/schema; sitemap revalidation được thêm. Domain canonical, Search Console và crawl production chưa xác minh.
- TESTING: PASS unit/static/browser local; CHƯA XÁC MINH migration/RLS/persistence trên staging, thanh toán/email thật, backup-restore và concurrent admin.

### Liên kết admin → dữ liệu → public

| Nhóm | Admin | Nguồn Supabase | Cập nhật public |
|---|---|---|---|
| Sản phẩm/giá/ảnh/trạng thái | Sản phẩm | `public.bakery` (`product`), Storage `bakery` | Tag products; sitemap khi tạo/sửa/xóa |
| Danh mục | Danh mục | `public.bakery` (`category`) | Tag categories; sitemap khi tạo/sửa/xóa |
| Bài viết/trang | Nội dung biên tập | `public.bakery` (type tương ứng) | Tag posts/pages; sitemap khi thay đổi |
| Trang chủ/cấu hình | Banner/giao diện/cài đặt | `public.bakery` (type cấu hình hiện hữu) | Tag cấu hình theo action hiện có |
| Đơn hàng/bánh riêng | Admin đơn hàng và checkout | RPC/bảng Supabase; Storage `bakery` | Không cache công khai dữ liệu đơn |

Đây là wiring theo source, chưa xác nhận persistence/RLS ở staging. **Kết luận: chưa đủ điều kiện mở production.** Cần staging riêng, kiểm tra schema/migration, Vercel Preview có credentials staging, E2E dữ liệu giả, xác nhận domain và quyết định riêng tư ảnh/rate limit trước khi lập kế hoạch production.