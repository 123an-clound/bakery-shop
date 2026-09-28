@AGENTS.md

# bakery-store — quy ước dự án

> Đặc tả đầy đủ nằm ở `KE-HOACH-DU-AN.md` (đọc file đó trước khi thay đổi kiến trúc).
> File này là bản tóm tắt nhanh để các phiên sau không phải đọc lại toàn bộ 1173 dòng.

## Ràng buộc cứng (không tự ý đổi)

- Stack: Next.js **16.3.1** (App Router) — kế hoạch gốc ghi Next 15.x nhưng đã được người dùng
  đồng ý nâng lên 16 ở Phase 0 (bản mới nhất tại thời điểm cài đặt). TypeScript strict +
  `noUncheckedIndexedAccess`. Tailwind CSS v4 (`@theme` trong `app/globals.css`). shadcn/ui
  (preset `nova`, base `radix`, icon `lucide`).
- Animation: dùng package **`motion`** (import từ `"motion/react"`), KHÔNG dùng `framer-motion`
  (đã đổi tên/thay thế — xem context7 `/websites/motion_dev`).
- Supabase project: `xsspvdgnhelzprcqaiek` ("123an-clound's Project", ap-southeast-1).
- **CHỈ 1 bảng `public.bakery`** cho toàn bộ dữ liệu, phân biệt bằng cột `type` + `data jsonb`.
  KHÔNG tạo bảng mới. Được phép tạo VIEW/INDEX/FUNCTION/TRIGGER/STORAGE BUCKET.
- **KHÔNG đụng** các bảng thuộc dự án khác đã tồn tại sẵn trong cùng project Supabase:
  `categories`, `menu_items`, `admin_users`, `kho_iphone`.
- Admin auth: mật khẩu đơn giản trong `ADMIN_PASSWORD` (env) + cookie ký HMAC-SHA256, KHÔNG
  bao giờ dùng `NEXT_PUBLIC_*` cho secret. Xem mục 6 trong kế hoạch cho luồng chi tiết.
- Song ngữ VI (mặc định, không prefix)/EN (`/en/...`) qua `next-intl`. Nội dung động lưu
  `{ "vi": "...", "en": "..." }`.
- Không deploy. Chỉ chạy local, nhưng code phải sẵn sàng deploy Vercel.
- Không tự bịa API key / dữ liệu ngân hàng / thông tin tiệm có thật — đã hỏi người dùng ở
  Phase 0, xem phần "Quyết định Phase 0" bên dưới.

## Quyết định đã chốt ở Phase 0

- Next.js: dùng bản 16 mới nhất thay vì pin 15.x (người dùng đồng ý, xem RULING trên).
- Không bật Google OAuth cho khách hàng (chỉ email/mật khẩu qua Supabase Auth).
- Ảnh seed dùng placeholder/Unsplash tạm — README phải ghi rõ đây là ảnh tạm.
- Thông tin tiệm (tên, hotline, địa chỉ...) dùng dữ liệu mẫu — chủ tiệm tự sửa sau trong
  `/admin/cai-dat`.
- Thông tin ngân hàng VietQR để trống — admin tự nhập sau trong `/admin/cai-dat`.
- Email: có `RESEND_API_KEY` thật, dùng Resend theo đúng kế hoạch.

## Mô hình dữ liệu — bảng `bakery` (single-table polymorphic + JSONB)

- Cột thật để lọc/sắp xếp/join: `type`, `slug`, `status`, `sort_order`, `parent_id`.
- Cột `data jsonb` chứa phần đặc thù theo từng `type` — validate bắt buộc bằng Zod
  (`lib/bakery/schemas.ts`) trước khi ghi. Đây là thứ thay thế ràng buộc kiểu dữ liệu.
- 15 giá trị `type`: setting, theme, category, product, banner, page, post, order, order_item,
  custom_cake, review, coupon, customer, favorite, media. Chi tiết shape từng loại xem mục 4.5
  của `KE-HOACH-DU-AN.md`.
- RLS: chỉ có policy SELECT cho `anon`/`authenticated` (nội dung `status='active'` công khai,
  review đã duyệt, đơn của chính chủ). KHÔNG có policy INSERT/UPDATE/DELETE cho client — mọi
  ghi đi qua Route Handler dùng `SUPABASE_SERVICE_ROLE_KEY` (`lib/supabase/admin.ts`, phải có
  `import 'server-only'` ở đầu file).
- Giá tiền luôn tính lại ở server khi tạo đơn — không bao giờ tin `total` từ client.

## Quy ước code

- Component: `PascalCase.tsx`; hook: `use-*.ts`; util: `kebab-case.ts`.
- Server Component là mặc định — chỉ thêm `'use client'` khi thực sự cần state/effect/event.
- Không `any`, không `@ts-ignore`, không `console.log` sót trong code cuối.
- Mọi truy cập `data` JSONB phải qua Zod parse hoặc type guard.
- Route/slug tiếng Việt không dấu (`/san-pham`, `/gio-hang`).
- Text hiển thị không hard-code trong JSX — lấy từ `messages/*.json` hoặc từ DB.
- Next.js 16: `params`/`searchParams`/`cookies()`/`headers()` là async — luôn `await`. Trước khi
  dùng API mới/lạ của App Router, đọc `node_modules/next/dist/docs/01-app/` hoặc dùng context7
  (`/websites/motion_dev`, `/darkroomengineering/lenis`, `/shadcn-ui/ui`...) thay vì suy từ
  trí nhớ — bản 16 có breaking changes so với 15 mà kế hoạch gốc dựa trên.
- Commit theo Conventional Commits (`feat(admin): them theme editor`), mỗi phase ≥ 1 commit.

## Tiến độ theo phase (cập nhật sau mỗi phase)

- [x] Phase 0 — Chuẩn bị: scaffold Next.js 16 + Tailwind v4 + shadcn/ui (nova/radix), cài đặt
      toàn bộ dependency theo mục 3 kế hoạch, `.env.local` đã điền đủ, `tsconfig` strict +
      `noUncheckedIndexedAccess`.
- [x] Phase 1 — Nền tảng dữ liệu: migration `0001_bakery_core.sql` + `0002_..._fix_advisors.sql`
      (advisors sạch, trừ 2 cảnh báo thuộc dự án khác/Auth toàn project — xem ADR), types sinh từ
      `Supabase.generate_typescript_types` (`lib/supabase/database.types.ts`), 3 client Supabase
      (`client.ts`/`server.ts`/`admin.ts`), Zod schema cho đủ 15 `type`
      (`lib/bakery/schemas.ts`, 13 unit test xanh), `queries.ts` + `mutations.ts`, seed script
      (`pnpm seed`) đã chạy: 2 setting, 1 theme, 6 category, 24 product, 3 banner, 3 post,
      4 page, 2 coupon, 6 review, 3 order. Xác nhận anon key insert bị chặn (401/RLS), anon đọc
      được sản phẩm active nhưng không đọc được setting/private (draft).
- [x] Phase 2 — Design system & layout: `app/` restructured dưới `app/[locale]/`
      (next-intl, vi mặc định không prefix). Next.js 16 đổi `middleware.ts` thành
      `proxy.ts` — dùng `proxy.ts` cho i18n routing. `globals.css` có token
      Playful Pastel 3D, đổi màu runtime qua inline style trên `<html>`
      (`lib/theme/css-vars.ts`, đọc từ `getTheme()`/`getSiteSettings()` —
      cached bằng `unstable_cache`, tag `theme`/`settings`). Font Baloo 2 +
      Be Vietnam Pro (`next/font`, subset vietnamese). Header/Footer/MobileNav/
      AnnouncementBar, 5 component motion (FadeIn/Parallax/Tilt3D/Marquee/
      Confetti), `/dev/ui` component gallery. Đã sửa 1 lỗi WCAG thật (cream
      trên destructive chỉ 3.06:1 → đổi sang cocoa đậm 5.19:1) và 1 lỗi
      hydration thật (đọc localStorage/matchMedia qua nhánh `typeof window`
      trong lazy `useState` — sửa bằng `useSyncExternalStore`). lucide-react
      bản đang dùng đã bỏ icon brand (Facebook/Instagram) — dùng SVG inline
      riêng (`components/icons/social.tsx`).
- [x] Phase 3 — Trang khách hàng phần đọc: `lib/bakery/catalog.ts` (danh mục/
      sản phẩm/banner/blog/trang tĩnh/review, cached qua `unstable_cache` +
      tags), full-text search qua RPC `search_products` (migration 0003).
      Trang chủ render động 11 section theo `theme.sections`. `/san-pham`
      (filter/sort/search/phân trang qua URL), `/san-pham/[slug]` (gallery,
      biến thể + giá realtime, tabs, review + form gửi review — Server
      Action, sản phẩm liên quan), `/danh-muc/[slug]`, `/tin-tuc(/[slug])`,
      `/gioi-thieu`, `/lien-he`, `/chinh-sach-giao-hang`, `/dieu-khoan`.
      SEO: JSON-LD, metadata + hreflang, `sitemap.xml`/`robots.txt`. Giỏ
      hàng CHƯA nối (Phase 4) — 2 nút trên trang sản phẩm + form newsletter/
      liên hệ dùng toast thông báo trung thực "sắp có", không giả vờ thành
      công. Next.js 16: `revalidateTag` cần thêm tham số `profile`; dùng
      `updateTag()` trong Server Action thay thế. Đã tìm & sửa 2 bug thật
      qua browser thật (Playwright): thiếu `priority` cho ảnh LCP hàng đầu,
      trang chi tiết sản phẩm thiếu giá gốc gạch ngang khi có sale.
- [x] Phase 4 — Giỏ hàng, đặt hàng, custom cake: Zustand cart (persist +
      `skipHydration`, xem `lib/store/cart.ts`), mini-cart trong Header/
      MobileNav, `/gio-hang` (coupon + free-ship progress), `/thanh-toan`
      (react-hook-form + zod) → `POST /api/orders` (tính giá lại hoàn toàn
      từ DB, validate option/price_delta, sinh mã đơn, gửi email) →
      `/dat-hang-thanh-cong/[code]` (VietQR, confetti) → `/tra-cuu-don-hang`
      (mã + 4 số cuối SĐT). `POST /api/upload` (magic bytes, uuid rename).
      `/dat-banh-theo-yeu-cau` wizard 5 bước. **Bug RLS thật đã sửa**: migration
      0004 — `coupon` chưa từng được liệt kê trong policy đọc công khai
      (từ 0002), khiến mọi mã giảm giá luôn báo "không tồn tại" cho khách —
      phát hiện và sửa qua kiểm thử trình duyệt thật, verify lại bằng đơn
      hàng thật (FREESHIP áp dụng đúng, order xuất hiện trong Supabase với
      giá tính lại ở server, đã test cả 2 kịch bản tấn công: gửi `total`
      giả bị bỏ qua, gửi option không tồn tại bị từ chối 400).
- [x] Phase 5 — Tài khoản khách hàng: đăng ký/đăng nhập/đăng xuất qua Supabase
      Auth (email/password) bằng Server Actions (`lib/actions/auth.ts`),
      `/tai-khoan/dang-ky`, `/tai-khoan/dang-nhap`. Header nhận biết trạng
      thái đăng nhập (dropdown "Tài khoản của tôi"/"Sản phẩm yêu thích"/
      "Đăng xuất" khi đã đăng nhập, link đăng nhập khi chưa). Yêu thích:
      `toggleFavorite` Server Action + `FavoriteButton`, gắn vào mọi lưới
      sản phẩm (trang chủ, danh mục, listing, chi tiết, sản phẩm liên quan)
      và trang `/tai-khoan/yeu-thich`. `/tai-khoan` hiển thị lịch sử đơn
      hàng của chính người dùng qua `getMyOrders()` — phạm vi hoàn toàn do
      RLS (`data->>'user_id' = auth.uid()`) quyết định, không lọc thủ công
      ở app. `POST /api/orders` gắn `user_id` khi có phiên đăng nhập; đặt
      hàng khách (guest) không bị ảnh hưởng. **Đã kiểm thử trực tiếp trên
      trình duyệt thật đúng tiêu chí DoD**: tạo 2 tài khoản test riêng
      biệt, mỗi tài khoản đặt 1 đơn, xác nhận `/tai-khoan` của mỗi tài
      khoản chỉ thấy đơn của chính mình (RLS enforce đúng theo cả 2
      chiều) — đã xoá dữ liệu test khỏi Supabase sau khi xác minh xong.
- [x] Phase 6 — Trang admin: đăng nhập admin bằng cookie ký HMAC-SHA256
      (Web Crypto, chạy được cả trong Edge-runtime `proxy.ts` lẫn Node route
      handler), rate limit 5 lần/15 phút/IP, `proxy.ts` chặn `/admin/*`
      (redirect `/admin/login`) và `/api/admin/*` (401 JSON). Layout admin
      riêng (root `<html>` riêng, không chung `[locale]`), sidebar thu gọn
      được, theme `.admin-theme` trung tính + accent hồng riêng biệt với
      theme khách. Dashboard đọc `v_revenue_daily` + số liệu thật. CRUD đầy
      đủ: sản phẩm (kéo-thả sort_order, uploader ảnh nén WebP, builder biến
      thể, preview trực tiếp), danh mục, đơn hàng (đổi trạng thái → ghi
      timeline + gửi email, đánh dấu đã thanh toán, ghi chú nội bộ, in hoá
      đơn khổ A5 riêng `@media print`, xuất CSV), bánh đặt riêng (báo giá →
      gửi email → chuyển thành đơn thật), đánh giá (duyệt/từ chối → tính lại
      `rating_avg`/`rating_count` sản phẩm cha), mã giảm giá, banner, bài
      viết + trang tĩnh (3 trang cố định), khách hàng (gộp từ đơn hàng, chỉ
      đọc). **Theme Editor** (`/admin/giao-dien`): bảng màu 8 màu + 5 preset,
      6 font Google Fonts hỗ trợ tiếng Việt (Be Vietnam Pro/Baloo 2/
      Quicksand/Nunito/Lora/Playfair Display — tất cả load tĩnh qua
      `next/font` để không cần rebuild khi đổi), slider bo góc, bật/tắt hiệu
      ứng, hero, kéo-thả thứ tự section + bật/tắt, thanh thông báo, preview
      trực tiếp qua iframe `?preview=1` + `postMessage` (màu/font/radius
      cập nhật ngay khi CHƯA lưu), khôi phục mặc định. Cài đặt: thông tin
      tiệm, ngân hàng (chọn từ 20 ngân hàng VietQR tĩnh, xem thử mã QR),
      vận chuyển, email nhận thông báo + gửi thử, SEO mặc định.
      **2 bug thật phát hiện qua kiểm thử trình duyệt trên bản production
      thật (`pnpm build && pnpm start`)**: (1) `DndContext` lồng trong
      `<tbody>` gây lỗi HTML không hợp lệ (div không được là con của tbody)
      — sửa bằng cách bọc cả `<Table>` thay vì chỉ bọc các dòng; (2)
      `X-Frame-Options: DENY` (đặt từ Phase 0) chặn luôn iframe preview của
      chính Theme Editor — đổi thành `SAMEORIGIN` (vẫn chặn framing từ site
      khác, chỉ cho phép tự nhúng chính mình). **Đã xác nhận đúng tiêu chí
      DoD quan trọng nhất của dự án**: đổi màu (preset Bạc hà mát) + tắt 1
      section trang chủ → lưu → mở tab khách mới xác nhận cả 2 thay đổi có
      hiệu lực ngay, không rebuild; thêm 1 sản phẩm mới qua admin → xuất
      hiện ngay trong danh sách sản phẩm khách (25 → sau khi xoá lại 24).
      Đã xoá/khôi phục toàn bộ dữ liệu test sau khi xác minh.
- [x] Phase 7 — Kiểm thử, tối ưu, bàn giao: **Security/OWASP** — sửa 1 XSS thật
      (`components/seo/json-ld.tsx` không escape `<` trước khi nhét JSON-LD vào
      `dangerouslySetInnerHTML`, cho phép admin-entered string phá vỡ thẻ
      `<script>`), 1 rò rỉ PII thật (log email khách khi Resend chưa cấu hình —
      redact khi `NODE_ENV=production`), thêm CSP header, thêm `requireAdmin()`
      trực tiếp vào route export CSV cho defense-in-depth.
      **Accessibility/WCAG** — sửa contrast thật trên CẢ hai theme: admin
      `--primary`/`--destructive` (Phase 6 cũ chỉ 2.61:1/4.37:1) và customer
      `--destructive` dùng làm text (3.15:1); phát hiện `text-primary` (màu nền
      hồng) bị dùng SAI làm màu CHỮ ở 20+ chỗ (header/footer/giá tiền/link) chỉ
      1.75-2.19:1 — đổi sang `text-brand-accent` (cocoa đậm, đúng vai trò "chữ dễ
      đọc", giữ nguyên `text-primary` ở các cặp nền+chữ đã đúng). Sửa thiếu
      label/aria-label trên ~10 form (checkout, đăng nhập/ký, tra cứu đơn, đặt
      bánh riêng, review, coupon, dropdown sắp xếp, nút thumbnail gallery, Radix
      Slider). Sửa `<dl>` sai cấu trúc (story-section), link trong đoạn văn chỉ
      phân biệt bằng màu (thiếu underline cố định), header brand name gây tràn
      ngang thật ở 360px (thiếu `min-w-0`/`truncate`).
      **Performance/Web Vitals** — phát hiện `next/font/google` mặc định
      `preload:true` khiến CẢ 6 font Theme Editor được eager-preload trên mọi
      trang dù chỉ 1-2 đang dùng, cạnh tranh băng thông với ảnh LCP trên mobile
      — tắt preload cho 4 font không phải mặc định. Next.js `priority` trên
      `<Image>` KHÔNG tự set `fetchpriority="high"` (xác nhận qua Context7) —
      thêm `fetchPriority="high"` cho ảnh hero + ảnh gallery sản phẩm. Đo được
      (Lighthouse mobile, throttling thật): LCP trang chủ 6.6s → 4.0s, điểm
      Performance 68 → 80. **Chưa đạt ngưỡng ≥90/LCP<2.5s mục 11** — nguyên
      nhân còn lại là ảnh placeholder Lorem Picsum (đã chốt là ảnh TẠM từ Phase
      0) cộng với server chạy local không có CDN thật; sẽ tự cải thiện đáng kể
      khi chủ tiệm thay ảnh thật + deploy lên hạ tầng thật, không cần sửa code.
      **Bug thật khác phát hiện qua Playwright trên bản production thật**: form
      đặt bánh riêng — `defaultNeedAt()` dùng `toISOString()` (UTC) làm giá trị
      cho `<input type="datetime-local">` (đọc là giờ ĐỊA PHƯƠNG, không phải
      UTC) — trên máy VN (UTC+7) khiến giá trị mặc định luôn bị server từ chối
      âm thầm vì thực tế chưa đủ 24h tối thiểu; sửa bằng cách dựng chuỗi từ các
      getter giờ địa phương. 2 file Server Action (`lib/actions/coupon.ts`,
      `lib/actions/reviews.ts`) trả thông báo tiếng Việt KHÔNG dấu hiển thị
      thẳng cho khách — đã thêm dấu đầy đủ.
      **Playwright e2e đầy đủ** (`tests/e2e/`, 6 file, 31 test, 13 kịch bản mục
      13) chạy trên `pnpm build && pnpm start` thật — phát hiện bug thật next-
      intl tự redirect `/` → `/en` khi Accept-Language mặc định của Chromium là
      en-US (đã cố định `locale: "vi-VN"` trong `playwright.config.ts`).
      Vitest thêm `t()` fallback i18n (49/49 unit test xanh). Test responsive
      360/768/1024/1440/1920px (không tràn ngang), `prefers-reduced-motion`,
      điều hướng bàn phím — đều xanh.
      **README.md** thêm trọn phần "Hướng dẫn cho chủ tiệm (không cần biết
      code)" ở đầu file: đăng nhập/đổi mật khẩu, thêm/sửa sản phẩm, thay ảnh,
      đổi tài khoản ngân hàng, đổi màu/thứ tự section, bảng tra cứu các trang
      hay dùng.
      ✅ **DoD**: `pnpm build && pnpm start` chạy sạch; toàn bộ e2e (31/31),
      unit test (49/49), typecheck, lint đều xanh trên bản production thật;
      kiến trúc + toàn bộ quyết định Phase 7 đã ghi vào `codebase-memory-mcp`.
- [x] Sub-dự án 1 — Hero 3D trang chủ (13 task, kế hoạch
      `docs/superpowers/plans/2026-09-22-3d-bakery-homepage-hero.md`): thêm
      `@react-three/fiber` + `@react-three/drei` + `three`, dựng bánh kem
      **procedural bằng hình khối (không dùng file GLB)**, một lớp scene 3D
      **persistent** (mount 1 lần trong layout dùng chung, không unmount khi
      chuyển route) điều khiển bằng scroll qua hàm biến đổi thuần (pure
      function) + store zustand riêng, có capability-detection (WebGL +
      `prefers-reduced-motion`) và error boundary rơi về ảnh tĩnh khi lỗi/
      không hỗ trợ. Theme mặc định đổi sang preset "premium bakery" (bảng
      màu caramel/kem/chocolate, heading Playfair Display), thứ tự section
      trang chủ sắp lại, hero thiết kế lại thành 1 cột giữa nằm trực tiếp
      trên lớp cảnh 3D. Playwright thêm `tests/e2e/07-scene-3d.spec.ts`
      (3 test: canvas mount + CTA vẫn bấm được, `prefers-reduced-motion`
      hiện fallback tĩnh, chuyển route giữ layout không vỡ/canvas trống).
      **Xác minh cuối (Task 13)**: `pnpm build` sạch; toàn bộ suite xanh —
      typecheck 0 lỗi, lint 0 lỗi (1 warning React Compiler có từ trước ở
      `checkout-form.tsx`, không liên quan), Vitest **58/58** (49 cũ + 9
      mới), Playwright **34/34** (31 cũ + 3 mới) trên `pnpm build && pnpm
      start` thật ở cổng 3000. Console trang chủ **0 lỗi**, chỉ 1 warning
      cấp thư viện (`THREE.Clock` deprecated, tự three.js phát ra, không
      phải code của dự án).
      **Lighthouse mobile** (Chrome headless, `--throttling-method=simulate`,
      đã cố định `--lang=vi-VN` để tránh next-intl auto-redirect `/`→`/en`
      làm sai số đo): **Performance 71** (baseline Phase 7: 80), **LCP 7.8s**
      (baseline: 4.0s) — **không đạt** ngưỡng chấp nhận được của kế hoạch
      (Performance ≥78, LCP ≤4.5s). Đã điều tra theo đúng yêu cầu của kế
      hoạch trước khi chấp nhận: kiểm tra chunk `SceneCanvas` qua Network —
      xác nhận `next/dynamic(..., { ssr: false })` (Task 9) hoạt động ĐÚNG,
      chunk chứa three.js/@react-three (~900KB raw/231KB gzip) **không**
      xuất hiện trong HTML ban đầu, không preload/bundle chung — code-split
      thật sự. Nguyên nhân tụt điểm là **kiến trúc**, không phải bug: vì
      `SceneRoot` mount vô điều kiện trong layout dùng chung (quyết định
      Task 8 — persistent qua mọi route), chunk nặng này vẫn bắt đầu tải +
      thực thi ngay sau hydrate trên mọi trang, cạnh tranh CPU/băng thông
      mobile với đường LCP-critical (787ms bootup-time riêng chunk này, lớn
      nhất trong toàn trang). Ghi nhận trung thực: đây là chi phí thật của
      kiến trúc "persistent scene layer", không tự khỏi khi có ảnh sản phẩm
      thật — cần tối ưu thêm (ví dụ trigger tải theo viewport/interaction
      thay vì ngay khi mount) nếu muốn đạt lại ngưỡng Phase 7, việc này nằm
      ngoài phạm vi Task 13 (chỉ xác minh, không refactor).
      **Tương phản chữ hero** (carry-forward từ review Task 11 — heading giờ
      nằm trực tiếp trên mesh bánh, không còn lớp overlay/tint như bản cũ):
      axe scan (`06-accessibility.spec.ts`) trên `/` **0 vi phạm nghiêm
      trọng** → không cần sửa. Xác minh thủ công thêm bằng mắt ở
      360/768/1024/1440px: mesh bánh có cắt ngang qua vùng chữ heading theo
      đúng thiết kế đã duyệt ở Task 11, nhưng chữ vẫn đọc được rõ (màu chữ
      cocoa đậm tương phản đủ trên cả nền kem lẫn nền bánh); phụ đề và 2 nút
      CTA luôn nằm ngoài vùng bánh ở cả 4 breakpoint, không bị che.
      **Reduced-motion**: bật `prefers-reduced-motion: reduce` xác nhận
      `<canvas>` bị gỡ hoàn toàn khỏi DOM (không chỉ ẩn bằng CSS), thay bằng
      ảnh tĩnh fallback — không còn animation dư.
      **Giỏ hàng/thanh toán**: thêm sản phẩm thật vào giỏ → `/gio-hang` →
      `/thanh-toan` đều render đúng, không bị lớp `SceneRoot` toàn cục ảnh
      hưởng. **Theme Editor** (`/admin/giao-dien?preview=1`): iframe preview
      hiển thị đúng cảnh 3D, không vỡ layout, không lỗi console.
      **Phát hiện ngoài phạm vi (không sửa vì không thuộc kế hoạch này)**:
      (1) danh sách `/san-pham` còn lẫn ~9 sản phẩm rác "E2E Admin Test
      Product..." (111.000 ₫) — dữ liệu test cũ chưa dọn trong Supabase,
      không phải do sub-dự án này tạo ra; (2) nút "Thêm vào giỏ" gọi
      `canvas-confetti` cố tạo Web Worker qua `blob:` URL, bị chặn bởi CSP
      `script-src` (chưa khai báo `worker-src`, đặt từ Phase 7) — thư viện
      tự fallback về main thread nên giỏ hàng vẫn hoạt động đúng, nhưng
      console có 1 lỗi CSP mỗi lần bấm; lỗi này có từ Phase 4/7, không liên
      quan 3D scene.
      **Cố ý hoãn lại** (đã ghi trong kế hoạch
      `docs/superpowers/plans/2026-09-22-3d-bakery-homepage-hero.md`, chưa
      làm ở sub-dự án 1): hiệu ứng 3D trên thẻ sản phẩm (product-card),
      micro-interaction 3D ở luồng thanh toán, và kể chuyện theo từng route
      riêng (per-route storytelling) — cảnh 3D hiện tại chỉ có 1 phiên bản
      dùng chung cho mọi trang.
- [x] Rà soát admin theo mục 9 (2026-09-28): bổ sung lọc đơn theo khoảng ngày
      (+CSV theo bộ lọc, nhãn tiếng Việt, BOM cho Excel), thẻ "Tổng sản phẩm",
      khách đã đăng ký chưa có đơn, banner hiển thị thật trên trang chủ (trước
      đó admin quản lý nhưng không render ở đâu), SEO riêng từng bài viết, các
      trường EN còn thiếu, uploader ảnh OG. Bug thật đã sửa: coupon/banner
      ngày-thuần hết hạn lúc 07:00 VN (`lib/utils/vn-date.ts`); lịch banner bị
      đánh giá trong `unstable_cache`; `datetime-local` nhận chuỗi UTC
      (`lib/utils/datetime-local.ts`); rate-limit login admin đếm cả lần đúng;
      CSP thiếu `blob:`; cleanup e2e sản phẩm không bao giờ chạy. Model 3D
      chuyển sang `cake-web.glb` (18.7 MB/13M vertex → 3.2 MB/1.3M) — bản full
      làm treo main thread, gây fail e2e checkout/bánh riêng. Unit 84/84,
      e2e 34/34 + 4 test admin mới (`04b-admin-extras.spec.ts`, phải chạy
      TRƯỚC `05` vì `05` cố tình khoá login). Lighthouse chưa đo lại.
