
# KẾ HOẠCH TRIỂN KHAI: WEBSITE BÁN BÁNH KEM & BÁNH NGỌT

> **File này là bản đặc tả đầy đủ dành cho Claude Code.**
> Đọc **toàn bộ** file trước khi gõ dòng code đầu tiên. Không tự ý đổi các quyết định đã chốt ở
> mục "RÀNG BUỘC BẮT BUỘC". Nếu phát hiện mâu thuẫn, **dừng lại và hỏi người dùng**, không đoán.

- **Tên dự án:** `bakery-store`
- **Thư mục làm việc:** `C:\Users\phamt\OneDrive\Desktop\My-project\bakery-store` (hiện đang trống)
- **Ngày lập kế hoạch:** 2026-08-20
- **Ngôn ngữ giao tiếp trong quá trình làm:** Tiếng Việt

---

## 0. RÀNG BUỘC BẮT BUỘC (NON-NEGOTIABLE)

| # | Ràng buộc | Chi tiết |
|---|-----------|----------|
| R1 | **Stack** | Next.js 15 (App Router) + TypeScript strict + Tailwind CSS v4 + shadcn/ui |
| R2 | **Database** | Supabase project `123an-clound's Project`, ref `xsspvdgnhelzprcqaiek`, region ap-southeast-1 |
| R3 | **CHỈ DÙNG DUY NHẤT 1 BẢNG `public.bakery`** | Toàn bộ dữ liệu (sản phẩm, danh mục, đơn hàng, cấu hình, bài viết, review, voucher…) nằm trong bảng này, phân biệt bằng cột `type` + cột `data jsonb`. **KHÔNG tạo bảng mới.** Được phép tạo VIEW, INDEX, FUNCTION, TRIGGER, STORAGE BUCKET. |
| R4 | **Không đụng dữ liệu cũ** | Các bảng `categories`, `menu_items`, `admin_users`, `kho_iphone` thuộc dự án khác — **không sửa, không xoá, không đọc**. |
| R5 | **Admin auth** | Mật khẩu đơn giản lưu trong biến môi trường (`.env.local`). Xem mục 6 để làm cho đúng và an toàn nhất có thể. |
| R6 | **Giao diện** | Hướng **Playful Pastel 3D** — xem design system ở mục 7. Phải "thật sinh động": animation, micro-interaction, parallax. |
| R7 | **Ngôn ngữ** | Song ngữ **Việt (mặc định) / Anh**. Nội dung động lưu dạng `{ "vi": "...", "en": "..." }`. |
| R8 | **Triển khai** | Chỉ chạy local (`http://localhost:3000`) trong phạm vi dự án này. **Không deploy.** Nhưng code phải sẵn sàng deploy Vercel. |
| R9 | **Thanh toán** | COD + Chuyển khoản QR (VietQR). Thông tin tài khoản ngân hàng **do admin tự nhập trong trang admin**, không hard-code. Gửi email xác nhận đơn. |
| R10 | **Không bịa** | Không tự chế API key, không giả lập dữ liệu Supabase. Nếu thiếu thông tin/khoá → dừng và hỏi. |

---

## 1. MỤC TIÊU SẢN PHẨM

Xây dựng website thương mại điện tử cho một tiệm bánh kem & bánh ngọt tại Việt Nam, gồm 2 phần:

**A. Trang khách hàng (public)**
- Trang chủ sinh động với hero 3D, slider banner, section sản phẩm nổi bật, câu chuyện thương hiệu.
- Danh mục & chi tiết sản phẩm, tìm kiếm, lọc, sắp xếp.
- Giỏ hàng + đặt hàng (COD / chuyển khoản QR).
- **Đặt bánh theo yêu cầu (custom cake)**: chọn size, cốt bánh, vị kem, chữ viết trên bánh, ngày giờ nhận, upload ảnh mẫu.
- Tài khoản khách hàng: đăng ký/đăng nhập, lịch sử đơn, danh sách yêu thích.
- Blog/Tin tức + đánh giá sản phẩm có sao.

**B. Trang quản trị (`/admin`)**
- CRUD sản phẩm, danh mục, upload ảnh (Supabase Storage), kéo-thả sắp xếp.
- **Theme Editor**: đổi logo, bảng màu, font, banner, bật/tắt & sắp xếp lại các section trang chủ, sửa nội dung About/Liên hệ — **không cần sửa code**.
- Quản lý đơn hàng: danh sách, đổi trạng thái, xem chi tiết, in hoá đơn, lọc theo ngày/trạng thái.
- Dashboard doanh thu: biểu đồ, top sản phẩm bán chạy, số đơn theo trạng thái.
- Quản lý mã giảm giá (voucher).
- Quản lý bài viết blog, duyệt/ẩn review.
- Cấu hình thông tin tiệm: tên, logo, hotline, địa chỉ, giờ mở cửa, mạng xã hội, **tài khoản ngân hàng cho VietQR**.

---

## 2. SKILLS & MCP PHẢI SỬ DỤNG

Người dùng đã cài sẵn các skill/MCP sau trong Claude Code. **Hãy dùng đúng skill ở đúng giai đoạn**, đừng làm chay:

| Giai đoạn | Skill / MCP bắt buộc dùng | Dùng để làm gì |
|-----------|---------------------------|----------------|
| Khởi động & lập kế hoạch chi tiết | `superpowers` | Chia nhỏ công việc, brainstorm giải pháp, quản lý workflow nhiều bước |
| Ghi nhớ ngữ cảnh xuyên phiên | `codebase-memory-mcp` | Lưu quyết định kiến trúc, schema JSON, quy ước đặt tên. Ghi lại sau **mỗi phase**. |
| Tra cứu API/thư viện | `context7` | Lấy docs **phiên bản mới nhất** của Next.js 15, Supabase JS v2, Tailwind v4, shadcn/ui, Framer Motion, Lenis. **Không viết code từ trí nhớ.** |
| Thiết kế DB & backend | `Database / Backend Architecture` | Review thiết kế JSONB, index, RLS, chiến lược query trước khi code |
| Thiết kế UI/UX | `uiux promax`, `taste-skill` | Xây design system, layout, hệ thống spacing, chọn phối màu, tinh chỉnh thẩm mỹ |
| Animation & scroll | `lenis` | Smooth scroll, scroll-triggered animation, parallax |
| SEO | `openseo` | Metadata, Open Graph, JSON-LD (Product / BreadcrumbList / LocalBusiness / Article), sitemap.xml, robots.txt |
| Chất lượng code | `impeccable`, `Karpathy` | Refactor, đặt tên, cấu trúc rõ ràng, loại bỏ code thừa, giữ code dễ đọc |
| Kiểm thử giao diện | `Browser / Visual Testing MCP` | Chụp màn hình từng trang, so sánh trước/sau, test luồng đặt hàng end-to-end |
| Bảo mật | `Security / OWASP` | Audit trước khi kết thúc mỗi phase backend: XSS, IDOR, rò rỉ key, rate-limit |
| Hiệu năng | `Performance / Web Vitals` | Đo LCP/CLS/INP, tối ưu ảnh, bundle size |
| Tiếp cận | `Accessibility / WCAG` | Kiểm tra tương phản màu, focus ring, aria-label, keyboard navigation |
| Supabase | MCP `Supabase` | Chạy `apply_migration`, `execute_sql`, `generate_typescript_types`, `get_advisors` |

> **Quy tắc vàng:** Trước khi viết code cho một thư viện, gọi `context7` lấy docs. Sau khi hoàn thành một
> phase, gọi `Security / OWASP` + `Accessibility / WCAG` + `Performance / Web Vitals` để tự kiểm.

---

## 3. TECH STACK CHI TIẾT

```
Framework      : Next.js 15.x (App Router, Server Components, Server Actions)
Ngôn ngữ       : TypeScript 5.x, strict: true, noUncheckedIndexedAccess: true
CSS            : Tailwind CSS v4 (CSS-first config qua @theme)
UI Components  : shadcn/ui (Radix UI) — chỉ cài component thực sự dùng
Animation      : Framer Motion (motion) + Lenis (smooth scroll)
Icons          : lucide-react
Form           : react-hook-form + zod (@hookform/resolvers)
State giỏ hàng : Zustand + persist vào localStorage
Data fetching  : Supabase JS v2 (@supabase/supabase-js, @supabase/ssr)
Biểu đồ admin  : Recharts
Bảng admin     : TanStack Table v8
Kéo-thả        : dnd-kit
Toast          : sonner
Ảnh            : next/image + Supabase Storage
Email          : Resend (hoặc Nodemailer + SMTP Gmail nếu người dùng không có Resend key)
QR chuyển khoản: VietQR (https://img.vietqr.io/image/{BANK}-{ACC}-compact2.png?amount=&addInfo=)
i18n           : next-intl
Định dạng      : Intl.NumberFormat('vi-VN', {currency:'VND'}), dayjs + locale vi
Lint/Format    : ESLint (next/core-web-vitals) + Prettier + prettier-plugin-tailwindcss
Test           : Vitest (unit) + Playwright (e2e)
Package manager: pnpm (fallback npm nếu máy chưa có pnpm)
```

### Cấu trúc thư mục

```
bakery-store/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx                 # Root layout: font, Lenis provider, i18n provider
│   │   ├── page.tsx                   # Trang chủ (render section theo cấu hình admin)
│   │   ├── san-pham/
│   │   │   ├── page.tsx               # Danh sách + filter + sort + phân trang
│   │   │   └── [slug]/page.tsx        # Chi tiết sản phẩm + review + gợi ý
│   │   ├── danh-muc/[slug]/page.tsx
│   │   ├── dat-banh-theo-yeu-cau/page.tsx
│   │   ├── gio-hang/page.tsx
│   │   ├── thanh-toan/page.tsx
│   │   ├── dat-hang-thanh-cong/[code]/page.tsx   # Hiện QR VietQR + tóm tắt đơn
│   │   ├── tra-cuu-don-hang/page.tsx
│   │   ├── tin-tuc/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── gioi-thieu/page.tsx
│   │   ├── lien-he/page.tsx
│   │   └── tai-khoan/
│   │       ├── page.tsx               # Thông tin + lịch sử đơn
│   │       ├── yeu-thich/page.tsx
│   │       ├── dang-nhap/page.tsx
│   │       └── dang-ky/page.tsx
│   ├── admin/
│   │   ├── layout.tsx                 # Kiểm tra cookie phiên admin, sidebar
│   │   ├── login/page.tsx
│   │   ├── page.tsx                   # Dashboard
│   │   ├── san-pham/                  # list + new + [id]/edit
│   │   ├── danh-muc/
│   │   ├── don-hang/                  # list + [id]
│   │   ├── banh-dat-rieng/
│   │   ├── giao-dien/                 # THEME EDITOR (quan trọng nhất)
│   │   ├── banner/
│   │   ├── bai-viet/
│   │   ├── danh-gia/
│   │   ├── ma-giam-gia/
│   │   ├── khach-hang/
│   │   └── cai-dat/                   # Thông tin tiệm, ngân hàng, SEO, email
│   ├── api/
│   │   ├── admin/login/route.ts       # POST: so sánh mật khẩu env, set cookie httpOnly
│   │   ├── admin/logout/route.ts
│   │   ├── admin/[...crud]/route.ts   # Mọi thao tác ghi của admin (dùng service role)
│   │   ├── orders/route.ts            # POST: tạo đơn từ khách (validate server-side)
│   │   ├── orders/[code]/route.ts     # GET: tra cứu đơn bằng mã + sđt
│   │   ├── upload/route.ts            # Upload ảnh lên Supabase Storage
│   │   └── revalidate/route.ts
│   ├── sitemap.ts
│   ├── robots.ts
│   └── globals.css                    # @theme tokens Tailwind v4
├── components/
│   ├── ui/                            # shadcn/ui
│   ├── layout/                        # Header, Footer, MobileNav, LenisProvider
│   ├── home/                          # HeroSection, FeaturedCakes, StorySection, ...
│   ├── product/                       # ProductCard, Gallery, AddToCart, ReviewList
│   ├── cart/
│   ├── checkout/
│   ├── admin/                         # DataTable, JsonForm, ImageUploader, ColorPicker
│   └── motion/                        # FadeIn, Parallax, Marquee, Confetti, Tilt3D
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Browser client (ANON key)
│   │   ├── server.ts                  # Server client (ANON key + cookie)
│   │   └── admin.ts                   # Service role client — CHỈ import trong server code
│   ├── bakery/
│   │   ├── types.ts                   # Type cho từng `type` trong bảng bakery
│   │   ├── schemas.ts                 # Zod schema validate `data` của từng type
│   │   ├── queries.ts                 # Hàm đọc: getProducts, getProductBySlug, getSettings...
│   │   └── mutations.ts               # Hàm ghi (server-only)
│   ├── auth/admin-session.ts          # Ký/verify cookie phiên admin
│   ├── i18n/                          # next-intl config + messages/vi.json, en.json
│   ├── utils/format.ts                # formatVND, formatDate, slugify (bỏ dấu tiếng Việt)
│   └── vietqr.ts
├── messages/{vi.json,en.json}
├── supabase/migrations/               # File .sql theo thứ tự
├── public/
├── tests/{e2e,unit}/
├── .env.local.example
├── CLAUDE.md                          # Quy ước dự án cho các phiên sau
└── README.md
```

---

## 4. THIẾT KẾ DỮ LIỆU — BẢNG `public.bakery` DUY NHẤT

### 4.1. Nguyên tắc

Vì ràng buộc chỉ được dùng 1 bảng, ta áp dụng mô hình **"single-table polymorphic + JSONB có kỷ luật"**:

- Các trường **luôn cần để lọc/sắp xếp/join** được đưa ra thành **cột thật** (`type`, `slug`, `status`,
  `sort_order`, `parent_id`) → index B-tree bình thường, query nhanh như bảng quan hệ.
- Các trường **đặc thù theo từng loại** nằm trong `data jsonb` → index GIN.
- Mỗi `type` có **một Zod schema** trong `lib/bakery/schemas.ts`. **Mọi thao tác ghi bắt buộc validate
  qua Zod trước khi gửi lên Supabase.** Đây là thứ thay thế cho ràng buộc kiểu dữ liệu mà ta đánh đổi.
- Tạo **VIEW** cho từng loại để code đọc gọn gàng và để chạy thống kê SQL.

> ⚠️ **Cảnh báo kỹ thuật cần ghi vào `CLAUDE.md`:** mô hình 1 bảng JSONB đánh đổi tính toàn vẹn dữ liệu
> (không có foreign key thật, không có CHECK theo cột) lấy sự đơn giản về số lượng bảng. Bù lại bằng:
> (1) Zod ở tầng ứng dụng, (2) CHECK constraint trên `type`, (3) VIEW + index, (4) hàm SQL kiểm tra
> `parent_id` trỏ đúng loại. Nếu sau này dữ liệu > ~50.000 dòng hoặc cần báo cáo phức tạp, nên tách bảng.

### 4.2. Danh sách giá trị `type`

| `type` | Ý nghĩa | `slug` | `parent_id` trỏ tới |
|--------|---------|--------|---------------------|
| `setting` | Cấu hình toàn site (bản ghi đơn, `slug='site'`) | có | — |
| `theme` | Cấu hình giao diện (bản ghi đơn, `slug='default'`) | có | — |
| `category` | Danh mục bánh | có | `category` (danh mục cha, tuỳ chọn) |
| `product` | Sản phẩm bánh | có | `category` |
| `banner` | Slide/banner trang chủ | — | — |
| `page` | Trang tĩnh (Giới thiệu, Chính sách…) | có | — |
| `post` | Bài viết blog | có | — |
| `order` | Đơn hàng | — | — |
| `order_item` | Dòng sản phẩm trong đơn | — | `order` |
| `custom_cake` | Yêu cầu đặt bánh riêng | — | `order` (nếu đã chốt thành đơn) |
| `review` | Đánh giá sản phẩm | — | `product` |
| `coupon` | Mã giảm giá | có (= mã) | — |
| `customer` | Hồ sơ khách hàng mở rộng | — | — |
| `favorite` | Sản phẩm yêu thích | — | `product` |
| `media` | Ảnh đã upload (thư viện media của admin) | — | — |

### 4.3. Giá trị `status` theo `type`

- `product`, `category`, `banner`, `page`, `post`: `active` \| `draft` \| `archived`
- `order`: `pending` (mới) \| `confirmed` \| `baking` \| `delivering` \| `completed` \| `cancelled`
- `review`: `pending` \| `approved` \| `rejected`
- `coupon`: `active` \| `expired` \| `disabled`
- `custom_cake`: `new` \| `quoted` \| `accepted` \| `rejected`
- còn lại: `active`

### 4.4. Migration SQL

Tạo file `supabase/migrations/0001_bakery_core.sql`, chạy bằng MCP `Supabase.apply_migration`.

```sql
-- =========================================================
-- 0001_bakery_core.sql  —  Bakery Store: single-table model
-- =========================================================

-- 1) Bổ sung cột vào bảng bakery hiện có (id bigint identity, created_at đã tồn tại)
alter table public.bakery
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists type       text        not null default 'product',
  add column if not exists slug       text,
  add column if not exists parent_id  bigint,
  add column if not exists status     text        not null default 'active',
  add column if not exists sort_order integer     not null default 0,
  add column if not exists data       jsonb       not null default '{}'::jsonb;

alter table public.bakery alter column type drop default;

-- 2) Ràng buộc
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bakery_type_check') then
    alter table public.bakery add constraint bakery_type_check check (type in (
      'setting','theme','category','product','banner','page','post',
      'order','order_item','custom_cake','review','coupon',
      'customer','favorite','media'
    ));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'bakery_parent_fk') then
    alter table public.bakery add constraint bakery_parent_fk
      foreign key (parent_id) references public.bakery(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'bakery_data_is_object') then
    alter table public.bakery add constraint bakery_data_is_object
      check (jsonb_typeof(data) = 'object');
  end if;
end $$;

-- 3) Index
create unique index if not exists bakery_type_slug_uidx
  on public.bakery (type, slug) where slug is not null;

create index if not exists bakery_type_status_sort_idx
  on public.bakery (type, status, sort_order, id desc);

create index if not exists bakery_parent_idx      on public.bakery (parent_id);
create index if not exists bakery_created_idx     on public.bakery (created_at desc);
create index if not exists bakery_data_gin_idx    on public.bakery using gin (data jsonb_path_ops);

-- Index riêng cho tra cứu đơn hàng bằng mã đơn / số điện thoại
create unique index if not exists bakery_order_code_uidx
  on public.bakery ((data->>'code')) where type = 'order';
create index if not exists bakery_order_phone_idx
  on public.bakery ((data->>'phone')) where type = 'order';
create index if not exists bakery_order_user_idx
  on public.bakery ((data->>'user_id')) where type = 'order';

-- Full-text search tiếng Việt (bỏ dấu) cho tên + mô tả sản phẩm
-- LƯU Ý: unaccent() mặc định là STABLE, KHÔNG dùng trực tiếp trong index được.
-- Phải bọc bằng một hàm IMMUTABLE như dưới đây, nếu không CREATE INDEX sẽ báo
-- "functions in index expression must be marked IMMUTABLE".
create extension if not exists unaccent with schema extensions;

create or replace function public.bakery_unaccent(txt text)
returns text language sql immutable strict parallel safe as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, txt)
$$;

create index if not exists bakery_product_search_idx
  on public.bakery using gin (
    to_tsvector('simple',
      public.bakery_unaccent(
        coalesce(data->'name'->>'vi','') || ' ' ||
        coalesce(data->'name'->>'en','') || ' ' ||
        coalesce(data->'short_description'->>'vi','')))
  ) where type = 'product';
-- Truy vấn tìm kiếm tương ứng:
--   where type='product' and to_tsvector('simple', public.bakery_unaccent(...))
--         @@ plainto_tsquery('simple', public.bakery_unaccent($1))

-- 4) Trigger updated_at
create or replace function public.bakery_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists bakery_touch on public.bakery;
create trigger bakery_touch before update on public.bakery
  for each row execute function public.bakery_touch_updated_at();

-- 5) Sinh mã đơn hàng dạng BK260820-4821
create or replace function public.bakery_next_order_code()
returns text language plpgsql as $$
declare
  candidate text;
begin
  loop
    candidate := 'BK' || to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'YYMMDD')
                 || '-' || lpad((floor(random()*10000))::int::text, 4, '0');
    exit when not exists (
      select 1 from public.bakery where type='order' and data->>'code' = candidate
    );
  end loop;
  return candidate;
end $$;

-- 6) VIEW cho từng loại (security_invoker để KHÔNG bypass RLS)
create or replace view public.v_products with (security_invoker = true) as
select id, slug, status, sort_order, parent_id as category_id, created_at, updated_at,
       data->'name'                      as name_i18n,
       data->>'sku'                      as sku,
       (data->>'price')::numeric         as price,
       (data->>'sale_price')::numeric    as sale_price,
       (data->>'is_featured')::boolean   as is_featured,
       (data->>'stock')::int             as stock,
       data->'images'                    as images,
       data
from public.bakery where type = 'product';

create or replace view public.v_categories with (security_invoker = true) as
select id, slug, status, sort_order, parent_id, created_at,
       data->'name' as name_i18n, data->>'icon' as icon, data
from public.bakery where type = 'category';

create or replace view public.v_orders with (security_invoker = true) as
select id, status, created_at, updated_at,
       data->>'code'                  as code,
       data->>'customer_name'         as customer_name,
       data->>'phone'                 as phone,
       data->>'user_id'               as user_id,
       data->>'payment_method'        as payment_method,
       (data->>'total')::numeric      as total,
       (data->>'subtotal')::numeric   as subtotal,
       (data->>'discount')::numeric   as discount,
       (data->>'shipping_fee')::numeric as shipping_fee,
       data
from public.bakery where type = 'order';

create or replace view public.v_reviews with (security_invoker = true) as
select id, status, created_at, parent_id as product_id,
       (data->>'rating')::int as rating,
       data->>'author'        as author,
       data->>'content'       as content,
       data
from public.bakery where type = 'review';

-- Thống kê doanh thu theo ngày, phục vụ dashboard admin
create or replace view public.v_revenue_daily with (security_invoker = true) as
select (created_at at time zone 'Asia/Ho_Chi_Minh')::date as day,
       count(*)                          as orders_count,
       sum((data->>'total')::numeric)    as revenue
from public.bakery
where type = 'order' and status in ('confirmed','baking','delivering','completed')
group by 1 order by 1 desc;

-- 7) RLS
alter table public.bakery enable row level security;

drop policy if exists bakery_public_read     on public.bakery;
drop policy if exists bakery_reviews_read    on public.bakery;
drop policy if exists bakery_own_orders_read on public.bakery;

-- (a) Nội dung công khai: ai cũng đọc được khi status = 'active'
create policy bakery_public_read on public.bakery
  for select to anon, authenticated
  using (
    status = 'active'
    and type in ('setting','theme','category','product','banner','page','post')
  );

-- (b) Review đã duyệt
create policy bakery_reviews_read on public.bakery
  for select to anon, authenticated
  using (type = 'review' and status = 'approved');

-- (c) Khách đã đăng nhập đọc đơn của chính mình
create policy bakery_own_orders_read on public.bakery
  for select to authenticated
  using (
    type in ('order','order_item','custom_cake','favorite','customer')
    and data->>'user_id' = auth.uid()::text
  );

-- (d) KHÔNG có policy INSERT/UPDATE/DELETE cho anon & authenticated.
--     Mọi thao tác ghi đi qua Route Handler của Next.js dùng SERVICE_ROLE key
--     (service_role bypass RLS). Đây là lớp phòng thủ chính.

-- 8) Storage bucket cho ảnh
insert into storage.buckets (id, name, public)
values ('bakery', 'bakery', true)
on conflict (id) do nothing;

-- Ai cũng xem được ảnh; chỉ service_role được ghi (upload đi qua API route)
drop policy if exists "bakery_media_public_read" on storage.objects;
create policy "bakery_media_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'bakery');
```

Sau khi chạy migration:
1. Gọi `Supabase.get_advisors` (security + performance) và **sửa hết cảnh báo**.
2. Gọi `Supabase.generate_typescript_types` → lưu vào `lib/supabase/database.types.ts`.

### 4.5. Hình dạng `data` cho từng `type`

Ghi các schema này thành Zod trong `lib/bakery/schemas.ts`. `I18n` = `{ vi: string; en?: string }`.

```jsonc
// type = 'setting', slug = 'site'   (bản ghi DUY NHẤT)
{
  "brand_name":   { "vi": "Tiệm Bánh Ngọt Ngào", "en": "Sweet Bakery" },
  "tagline":      { "vi": "...", "en": "..." },
  "logo_url": "https://.../logo.png",
  "favicon_url": "...",
  "hotline": "0900 000 000",
  "email": "shop@example.com",
  "address": { "vi": "123 Đường ABC, Q.1, TP.HCM", "en": "..." },
  "map_embed": "<iframe .../>",
  "opening_hours": { "vi": "7:00 - 21:00 hằng ngày", "en": "..." },
  "socials": { "facebook": "", "instagram": "", "tiktok": "", "zalo": "" },
  "bank": {                       // ADMIN TỰ NHẬP — dùng sinh QR VietQR
    "bank_code": "970436",        // mã ngân hàng theo chuẩn VietQR (VCB = 970436)
    "bank_name": "Vietcombank",
    "account_number": "0123456789",
    "account_name": "PHAM TUAN AN",
    "transfer_note_prefix": "BANHKEM"
  },
  "shipping": { "fee": 25000, "free_from": 500000, "note": { "vi": "...", "en": "..." } },
  "seo": { "title": {...}, "description": {...}, "og_image": "..." },
  // KHÔNG để thông tin nhạy cảm ở đây — bản ghi này ai cũng đọc được (RLS cho phép public read).
}

// type = 'setting', slug = 'private', status = 'draft'  → RLS KHÔNG cho public đọc
// (policy public chỉ cho đọc khi status = 'active'). Chỉ server dùng service role đọc được.
{
  "notify_emails": ["chu-tiem@example.com"],   // nơi nhận email báo đơn mới
  "internal_note": ""
}

// type = 'theme', slug = 'default'   (bản ghi DUY NHẤT — điều khiển toàn bộ giao diện)
{
  "colors": {
    "primary": "#F7A8C4", "secondary": "#FFE7C7", "accent": "#7B4B2A",
    "background": "#FFFBF7", "foreground": "#3A2A22",
    "muted": "#F3E9E1", "success": "#8BC79A", "destructive": "#E76A6A"
  },
  "radius": "1.5rem",
  "fonts": { "heading": "Baloo 2", "body": "Be Vietnam Pro" },
  "hero": {
    "variant": "pastel-3d",            // pastel-3d | image-full | video | split
    "title": { "vi": "...", "en": "..." },
    "subtitle": { "vi": "...", "en": "..." },
    "image_url": "...",
    "cta": { "label": {"vi":"Đặt bánh ngay"}, "href": "/san-pham" }
  },
  "sections": [                        // ADMIN KÉO-THẢ ĐỔI THỨ TỰ & BẬT/TẮT
    { "key": "hero",         "enabled": true,  "order": 1 },
    { "key": "categories",   "enabled": true,  "order": 2 },
    { "key": "featured",     "enabled": true,  "order": 3, "props": { "limit": 8 } },
    { "key": "custom_cake",  "enabled": true,  "order": 4 },
    { "key": "best_sellers", "enabled": true,  "order": 5 },
    { "key": "story",        "enabled": true,  "order": 6 },
    { "key": "testimonials", "enabled": true,  "order": 7 },
    { "key": "blog",         "enabled": false, "order": 8 },
    { "key": "instagram",    "enabled": false, "order": 9 },
    { "key": "newsletter",   "enabled": true,  "order": 10 }
  ],
  "effects": { "smooth_scroll": true, "confetti_on_add_to_cart": true, "parallax": true, "reduced_motion_respect": true },
  "announcement_bar": { "enabled": true, "text": { "vi": "Freeship đơn từ 500k 🎂" }, "href": "" }
}

// type = 'category'
{ "name": {"vi":"Bánh kem","en":"Cakes"}, "description": {...}, "image_url": "...",
  "icon": "cake", "seo": { "title": {...}, "description": {...} } }

// type = 'product'   (parent_id = id của category)
{
  "name": { "vi": "Bánh kem dâu tây", "en": "Strawberry Cake" },
  "short_description": { "vi": "...", "en": "..." },
  "description": { "vi": "<p>HTML sanitize</p>", "en": "..." },
  "sku": "BK-DAU-01",
  "price": 350000,
  "sale_price": 299000,          // null nếu không giảm
  "unit": { "vi": "cái", "en": "piece" },
  "images": ["https://.../1.webp", "https://.../2.webp"],
  "stock": 20,                    // null = không quản lý tồn
  "is_featured": true,
  "is_best_seller": false,
  "badges": ["new", "hot"],
  "options": [                    // biến thể: size, vị…
    { "key": "size", "label": {"vi":"Kích thước"},
      "choices": [ {"value":"16cm","label":{"vi":"16cm"},"price_delta":0},
                   {"value":"20cm","label":{"vi":"20cm"},"price_delta":120000} ] }
  ],
  "ingredients": { "vi": "...", "en": "..." },
  "allergens": ["gluten","dairy","egg"],
  "prep_time_hours": 4,
  "rating_avg": 4.8, "rating_count": 12,     // cập nhật khi duyệt review
  "seo": { "title": {...}, "description": {...} }
}

// type = 'banner'
{ "title": {...}, "subtitle": {...}, "image_url": "...", "image_mobile_url": "...",
  "href": "/san-pham", "cta_label": {...}, "starts_at": null, "ends_at": null }

// type = 'post'
{ "title": {...}, "excerpt": {...}, "content": {...}, "cover_url": "...",
  "author": "Admin", "tags": ["cong-thuc"], "published_at": "2026-08-20T10:00:00+07:00",
  "seo": {...} }

// type = 'page'   (slug: gioi-thieu | lien-he | chinh-sach-giao-hang | dieu-khoan)
{ "title": {...}, "content": {...}, "cover_url": "...", "seo": {...} }

// type = 'order'
{
  "code": "BK260820-4821",
  "user_id": null,                       // uuid nếu khách đã đăng nhập
  "customer_name": "Nguyễn Văn A",
  "phone": "0912345678",
  "email": "a@example.com",
  "address": { "line": "12 Lê Lợi", "ward": "P.Bến Nghé", "district": "Q.1", "city": "TP.HCM" },
  "delivery_at": "2026-08-22T15:00:00+07:00",
  "note": "Giao trước 15h",
  "payment_method": "cod",               // cod | bank_transfer
  "payment_status": "unpaid",            // unpaid | paid | refunded
  "coupon_code": "SINHNHAT10",
  "subtotal": 650000, "discount": 65000, "shipping_fee": 0, "total": 585000,
  "items_snapshot": [                    // BẢN SAO tại thời điểm đặt, KHÔNG đổi khi sản phẩm đổi giá
    { "product_id": 12, "name": "Bánh kem dâu tây", "image": "...", "unit_price": 350000,
      "qty": 1, "options": {"size":"20cm"}, "line_total": 470000 }
  ],
  "timeline": [ { "status": "pending", "at": "...", "by": "system", "note": "" } ]
}
// Ghi chú: `items_snapshot` là nguồn sự thật. Ngoài ra vẫn tạo các bản ghi
// type='order_item' (parent_id = order) để tiện thống kê SQL top sản phẩm bán chạy.

// type = 'order_item'   (parent_id = order id)
{ "product_id": 12, "name": "Bánh kem dâu tây", "qty": 1,
  "unit_price": 350000, "options": {"size":"20cm"}, "line_total": 470000 }

// type = 'custom_cake'
{ "customer_name": "...", "phone": "...", "email": "...",
  "size": "20cm", "layers": 2, "sponge": "chocolate", "cream": "tuoi",
  "flavor": "dau", "message_on_cake": "Happy Birthday Mẹ!",
  "color_theme": "pastel hồng", "budget": 600000,
  "need_at": "2026-08-25T18:00:00+07:00",
  "reference_images": ["https://.../ref1.jpg"],
  "note": "...", "quoted_price": null, "admin_reply": null }

// type = 'review'   (parent_id = product id)
{ "author": "Minh", "user_id": null, "rating": 5, "content": "...",
  "images": [], "order_code": "BK260820-4821" }

// type = 'coupon'   (slug = mã, viết HOA)
{ "code": "SINHNHAT10", "discount_type": "percent",   // percent | fixed
  "value": 10, "max_discount": 100000, "min_order": 300000,
  "usage_limit": 100, "used_count": 3,
  "starts_at": "...", "ends_at": "...",
  "description": {"vi":"Giảm 10% đơn từ 300k"} }

// type = 'customer'
{ "user_id": "uuid", "full_name": "...", "phone": "...",
  "addresses": [ {...} ], "birthday": "1998-05-01", "points": 0 }

// type = 'favorite'   (parent_id = product id)
{ "user_id": "uuid" }

// type = 'media'
{ "url": "...", "path": "products/abc.webp", "width": 1200, "height": 1200,
  "size": 234567, "mime": "image/webp", "alt": {"vi":"..."} }
```

### 4.6. Dữ liệu mẫu (seed) — bắt buộc

Tạo `supabase/seed.sql` hoặc script `scripts/seed.ts` chèn:
- 1 bản ghi `setting` (slug `site`) và 1 bản ghi `theme` (slug `default`) với giá trị mặc định ở trên.
- 6 danh mục: Bánh kem sinh nhật, Bánh ngọt / Pastry, Bánh mì ngọt, Cupcake & Muffin, Cookie & Quà tặng, Bánh theo mùa.
- **Tối thiểu 24 sản phẩm** (4/danh mục) với giá thật, mô tả tiếng Việt tự nhiên, `is_featured` cho 8 món.
- 3 banner, 3 bài viết blog, 4 trang tĩnh, 2 mã giảm giá, 6 review đã duyệt.
- 3 đơn hàng mẫu ở các trạng thái khác nhau (để dashboard có số liệu).
- **Ảnh:** dùng ảnh placeholder chất lượng cao (ví dụ Unsplash source URL cho bánh) hoặc SVG tự tạo.
  **Không dùng ảnh bản quyền.** Ghi rõ trong README rằng đây là ảnh tạm, chủ tiệm sẽ thay bằng ảnh thật.

---

## 5. BIẾN MÔI TRƯỜNG

Tạo `.env.local.example` (commit) và `.env.local` (KHÔNG commit, thêm vào `.gitignore`).

```bash
# --- Supabase ---
NEXT_PUBLIC_SUPABASE_URL=https://xsspvdgnhelzprcqaiek.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable/anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key — TUYỆT ĐỐI KHÔNG để lộ ra client>

# --- Admin (mật khẩu đơn giản) ---
ADMIN_PASSWORD=<mật khẩu người dùng tự đặt>
ADMIN_SESSION_SECRET=<chuỗi ngẫu nhiên >= 32 ký tự, dùng ký cookie>

# --- Email thông báo đơn hàng ---
RESEND_API_KEY=
EMAIL_FROM="Tiệm Bánh <onboarding@resend.dev>"

# --- Khác ---
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Cách lấy key:** dùng MCP `Supabase.get_publishable_keys` cho anon key. **Service role key phải do
người dùng tự lấy trong Supabase Dashboard → Settings → API và tự dán vào `.env.local`.**
Claude Code **không được** tự tạo/đoán key, và **không được** in key ra chat/log.

---

## 6. KIẾN TRÚC BẢO MẬT (rất quan trọng)

Người dùng chọn "mật khẩu đơn giản lưu trong env". Đây là lựa chọn tiện lợi nhưng yếu, nên **bắt buộc**
triển khai theo đúng cách dưới đây để không biến nó thành lỗ hổng:

### 6.1. Ba lớp phòng thủ

1. **RLS bật trên `public.bakery`, không có policy ghi nào cho `anon`/`authenticated`.**
   → Kể cả khi anon key lộ (nó vốn là public), kẻ tấn công **không thể** thêm/sửa/xoá dữ liệu.
2. **Mọi thao tác ghi đi qua Route Handler / Server Action của Next.js**, dùng
   `SUPABASE_SERVICE_ROLE_KEY`. File `lib/supabase/admin.ts` phải bắt đầu bằng `import 'server-only'`.
3. **Route Handler admin kiểm tra cookie phiên admin trước mọi thao tác.**

### 6.2. Cơ chế đăng nhập admin

```
POST /api/admin/login  { password }
  → so sánh với process.env.ADMIN_PASSWORD bằng so sánh hằng thời gian
    (crypto.timingSafeEqual) để chống timing attack
  → nếu đúng: tạo token = HMAC-SHA256(payload{exp}, ADMIN_SESSION_SECRET)
  → Set-Cookie: bk_admin=<token>; HttpOnly; SameSite=Strict; Secure(khi https); Path=/; Max-Age=8h
  → nếu sai: trả 401, KHÔNG nói "sai mật khẩu" chi tiết
```

- **Rate limit:** tối đa 5 lần thử / 15 phút / IP (lưu in-memory Map là đủ cho local; ghi TODO nếu deploy).
- `middleware.ts`: chặn mọi request tới `/admin/*` (trừ `/admin/login`) và `/api/admin/*` khi cookie
  không hợp lệ hoặc hết hạn → redirect `/admin/login`.
- **Không bao giờ** đọc `ADMIN_PASSWORD` ở component client. Không đặt tiền tố `NEXT_PUBLIC_`.
- `/admin/*` phải có `export const metadata = { robots: { index: false, follow: false } }`.

### 6.3. Checklist bảo mật (chạy skill `Security / OWASP` để đối chiếu)

- [ ] `SUPABASE_SERVICE_ROLE_KEY` không xuất hiện trong bất kỳ file nào trong `app/**/*` chạy ở client.
  Kiểm chứng: build xong, `grep -r "service_role" .next/static/` phải rỗng.
- [ ] Mọi input từ khách được validate bằng **Zod ở phía server** (không tin validate client).
- [ ] **Giá tiền tính lại hoàn toàn ở server** khi tạo đơn. Không bao giờ tin `total` do client gửi lên.
- [ ] Mã giảm giá được kiểm tra ở server (còn hạn, chưa vượt `usage_limit`, đủ `min_order`).
- [ ] Nội dung HTML từ admin (mô tả sản phẩm, bài viết) phải sanitize (`isomorphic-dompurify`) trước khi
  `dangerouslySetInnerHTML`.
- [ ] Upload ảnh: giới hạn 5MB, chỉ chấp nhận `image/jpeg|png|webp|avif`, kiểm tra magic bytes chứ
  không chỉ tin `Content-Type`, đổi tên file thành uuid.
- [ ] Tra cứu đơn hàng bằng mã đơn **phải kèm 4 số cuối điện thoại** (chống dò mã đơn / IDOR).
- [ ] Không log dữ liệu cá nhân (sđt, địa chỉ, email) ra console ở production.
- [ ] Thêm security headers trong `next.config.ts`: `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, CSP cơ bản.

---

## 7. DESIGN SYSTEM — "PLAYFUL PASTEL 3D"

> Trước khi code UI, gọi skill `uiux promax` + `taste-skill` để tinh chỉnh. Đây là điểm xuất phát,
> không phải giới hạn. Mục tiêu cảm giác: **ấm áp, ngọt ngào, vui tươi, đáng tin cậy** — nhìn là muốn ăn.

### 7.1. Design tokens (khai báo trong `globals.css` bằng `@theme` của Tailwind v4)

```css
@theme {
  /* Màu — lấy giá trị RUNTIME từ bản ghi theme, đây chỉ là fallback */
  --color-cream:      #FFFBF7;   /* nền chính */
  --color-blush:      #F7A8C4;   /* hồng phấn — primary */
  --color-blush-deep: #E87BA6;
  --color-butter:     #FFE7C7;   /* kem bơ — secondary */
  --color-cocoa:      #7B4B2A;   /* nâu socola — accent */
  --color-cocoa-dark: #3A2A22;   /* chữ */
  --color-mint:       #A8DCC4;   /* điểm nhấn phụ */
  --color-berry:      #E76A6A;

  --radius-blob: 2.5rem;
  --font-heading: "Baloo 2", system-ui;   /* tròn trịa, vui */
  --font-body: "Be Vietnam Pro", system-ui;  /* hỗ trợ dấu tiếng Việt tốt */

  --shadow-soft: 0 8px 30px -8px rgb(123 75 42 / 0.15);
  --shadow-lift: 0 20px 45px -12px rgb(232 123 166 / 0.35);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

**Cơ chế theme động:** `app/[locale]/layout.tsx` đọc bản ghi `theme` từ Supabase (cache với
`revalidate`), rồi inject vào `<html style="--color-blush: ...">`. Admin đổi màu trong Theme Editor →
gọi `revalidateTag('theme')` → toàn site đổi màu **không cần build lại**. Đây là yêu cầu cốt lõi
"admin tuỳ chỉnh linh hoạt trang web".

### 7.2. Nguyên tắc thị giác

- **Bo góc lớn** (`rounded-3xl` trở lên), không dùng góc vuông sắc.
- **Blob SVG** nền pastel trôi nhẹ phía sau các section (animate bằng CSS `@keyframes`, không dùng JS).
- **Bóng mềm, nhiều lớp** thay vì viền cứng.
- **Ảnh sản phẩm cắt tròn hoặc "squircle"**, có bóng đổ ấm.
- **Typography:** heading `font-heading` cỡ lớn (clamp 2.5rem → 4.5rem), tracking hơi âm; body 16-18px,
  line-height 1.7 (tiếng Việt có dấu cần thoáng).
- **Khoảng trắng rộng rãi:** section padding dọc tối thiểu 96px desktop / 64px mobile.
- **Không quá 3 màu chủ đạo** trên một màn hình.

### 7.3. Motion (Framer Motion + Lenis)

| Tương tác | Hiệu ứng |
|-----------|----------|
| Scroll toàn trang | Lenis smooth scroll (`lerp: 0.1`), tắt trên mobile nếu gây giật |
| Section vào viewport | Fade + slide-up 24px, stagger 60ms giữa các item |
| Hero | Ảnh bánh xoay nhẹ theo con trỏ (tilt 3D, `rotateX/rotateY` tối đa 8°), lớp nền parallax |
| Card sản phẩm hover | `scale 1.03` + nâng bóng + ảnh zoom 1.08, easing `--ease-bounce` |
| Thêm vào giỏ | Ảnh "bay" vào icon giỏ + confetti nhỏ + badge giỏ nảy |
| Nút bấm | Nhấn xuống `scale 0.96`, nhả ra nảy nhẹ |
| Marquee | Dải chữ chạy ngang "🍰 Bánh tươi mỗi ngày • Giao nhanh 2h • ..." |
| Trang chuyển | Fade nhẹ 200ms |
| Loading | Skeleton bo tròn màu pastel, KHÔNG dùng spinner xám |

**BẮT BUỘC:** tôn trọng `prefers-reduced-motion: reduce` — tắt toàn bộ parallax/confetti/smooth-scroll.

### 7.4. Accessibility (chạy skill `Accessibility / WCAG`)

- Tương phản chữ/nền ≥ **4.5:1** (màu pastel rất dễ trượt chuẩn này — **phải đo, không đoán**).
  Chữ trên nền hồng `#F7A8C4` phải dùng `--color-cocoa-dark`, không dùng trắng.
- Mọi nút/link có focus ring rõ ràng (`focus-visible:ring-4 ring-blush/50`).
- Ảnh sản phẩm có `alt` lấy từ tên sản phẩm theo ngôn ngữ hiện tại.
- Form có `<label>` gắn `htmlFor`, thông báo lỗi liên kết bằng `aria-describedby`.
- Điều hướng bàn phím đầy đủ cho menu, modal (focus trap), carousel.
- Target chạm ≥ 44×44px trên mobile.

---

## 8. ĐẶC TẢ TRANG KHÁCH HÀNG

### 8.1. Trang chủ `/`
Render **động theo mảng `theme.sections`** (thứ tự + bật/tắt do admin quyết định). Mỗi section là 1
component nhận props từ JSON:

1. `announcement_bar` — dải thông báo trên cùng, đóng được (nhớ trong localStorage).
2. `hero` — tiêu đề lớn, mô tả, 2 CTA ("Đặt bánh ngay", "Xem thực đơn"), ảnh bánh 3D tilt, blob nền.
3. `categories` — lưới 6 danh mục dạng thẻ tròn có icon, hover nảy.
4. `featured` — carousel/lưới sản phẩm nổi bật, badge "Mới"/"Hot", nút thêm giỏ nhanh.
5. `custom_cake` — banner mời đặt bánh theo yêu cầu, CTA sang form.
6. `best_sellers` — top bán chạy (tính từ `order_item`).
7. `story` — câu chuyện tiệm bánh, ảnh + text so le, số liệu đếm lên (5000+ chiếc bánh…).
8. `testimonials` — review 5 sao dạng carousel.
9. `blog` — 3 bài viết mới nhất.
10. `instagram` — lưới ảnh (link ngoài).
11. `newsletter` — ô đăng ký nhận tin (lưu vào `type='customer'` hoặc bỏ qua nếu chưa cần).

### 8.2. Danh sách sản phẩm `/san-pham`
- Sidebar lọc: danh mục, khoảng giá (slider), badge (mới/hot/giảm giá), còn hàng.
- Sắp xếp: mới nhất, giá tăng/giảm, bán chạy, đánh giá cao.
- Ô tìm kiếm có debounce, dùng full-text index tiếng Việt (không dấu vẫn ra kết quả).
- Phân trang hoặc "Xem thêm" (infinite scroll), giữ trạng thái filter trên URL query để share link được.
- Skeleton khi loading. Trạng thái rỗng có minh hoạ dễ thương + gợi ý.

### 8.3. Chi tiết sản phẩm `/san-pham/[slug]`
- Gallery ảnh (zoom khi hover, lightbox khi click, vuốt trên mobile).
- Tên, giá (gạch giá gốc nếu có `sale_price`), đánh giá sao, badge.
- Chọn tuỳ chọn (size/vị) → **giá cập nhật realtime** theo `price_delta`.
- Chọn số lượng, nút "Thêm vào giỏ" + "Mua ngay".
- Tabs: Mô tả / Thành phần & dị ứng / Bảo quản / Vận chuyển.
- Phần đánh giá: danh sách review đã duyệt + form gửi review.
- "Có thể bạn thích" — sản phẩm cùng danh mục.
- **SEO:** JSON-LD `Product` (giá, availability, aggregateRating) + breadcrumb — dùng skill `openseo`.

### 8.4. Đặt bánh theo yêu cầu `/dat-banh-theo-yeu-cau`
Form nhiều bước (stepper), có thanh tiến trình, animation chuyển bước:
1. Kiểu bánh & kích thước & số tầng.
2. Cốt bánh, vị kem, màu chủ đạo.
3. Chữ viết trên bánh + upload tối đa 3 ảnh mẫu tham khảo.
4. Ngày giờ cần nhận (không cho chọn sớm hơn `prep_time_hours` mặc định 24h), ngân sách dự kiến.
5. Thông tin liên hệ → gửi.
→ Tạo bản ghi `type='custom_cake'`, gửi email cho admin, hiện màn hình cảm ơn + mã yêu cầu.

### 8.5. Giỏ hàng `/gio-hang`
- Zustand + persist localStorage. Sửa số lượng, xoá, nhập mã giảm giá (validate qua API server).
- Hiện phí ship theo `setting.shipping` (miễn phí từ mốc `free_from`, có thanh tiến trình
  "Mua thêm 120.000₫ để được freeship").
- Mini-cart dạng drawer mở từ header.

### 8.6. Thanh toán `/thanh-toan`
- Form: họ tên, sđt (validate regex VN), email, địa chỉ (tỉnh/quận/phường — dùng danh sách tĩnh JSON
  hành chính VN, hoặc nhập tự do nếu không có sẵn), ngày giờ nhận, ghi chú.
- Chọn phương thức: **COD** hoặc **Chuyển khoản**.
- Đặt hàng → `POST /api/orders`:
  1. Validate Zod ở server.
  2. **Tính lại toàn bộ giá từ DB** (không tin client).
  3. Validate mã giảm giá, tăng `used_count`.
  4. Sinh mã đơn bằng `bakery_next_order_code()`.
  5. Insert `order` + các `order_item`.
  6. Gửi email xác nhận cho khách + email báo đơn mới cho `setting/private.notify_emails`.
  7. Trả về mã đơn.
- Redirect sang `/dat-hang-thanh-cong/[code]`.

### 8.7. Đặt hàng thành công `/dat-hang-thanh-cong/[code]`
- Confetti chúc mừng.
- Tóm tắt đơn + mã đơn (nút copy).
- **Nếu chọn chuyển khoản:** hiện **mã QR VietQR** sinh từ `setting.bank`:
  `https://img.vietqr.io/image/{bank_code}-{account_number}-compact2.png?amount={total}&addInfo={prefix}{code}&accountName={account_name}`
  kèm thông tin ngân hàng dạng text có nút copy từng dòng (số TK, chủ TK, số tiền, nội dung CK).
- Hướng dẫn: "Sau khi chuyển khoản, tiệm sẽ xác nhận trong 15 phút."

### 8.8. Tra cứu đơn `/tra-cuu-don-hang`
Nhập mã đơn + 4 số cuối điện thoại → hiện trạng thái đơn dạng timeline có icon (Đã nhận đơn → Đang làm
bánh → Đang giao → Hoàn tất).

### 8.9. Tài khoản khách hàng
- Supabase Auth: đăng ký/đăng nhập bằng email + mật khẩu (bật thêm Google OAuth nếu người dùng muốn — hỏi trước).
- `/tai-khoan`: thông tin cá nhân, sổ địa chỉ, lịch sử đơn (đọc qua RLS policy `bakery_own_orders_read`).
- `/tai-khoan/yeu-thich`: danh sách yêu thích (icon trái tim trên card sản phẩm).
- Khách **không đăng nhập vẫn đặt hàng được** (guest checkout) — bắt buộc.

### 8.10. Blog & trang tĩnh
- `/tin-tuc`, `/tin-tuc/[slug]` (JSON-LD `Article`, mục lục, bài liên quan).
- `/gioi-thieu`, `/lien-he` (form liên hệ + bản đồ + thông tin từ `setting`), `/chinh-sach-*`.

### 8.11. Header / Footer
- Header sticky, thu nhỏ khi cuộn, có: logo (từ setting), menu, ô tìm kiếm, chọn ngôn ngữ VI/EN,
  icon tài khoản, icon giỏ hàng có badge số lượng.
- Mobile: menu drawer toàn màn hình, thanh điều hướng dưới cùng (Trang chủ / Danh mục / Giỏ / Tài khoản).
- Footer: thông tin tiệm, giờ mở cửa, mạng xã hội, link chính sách, đăng ký nhận tin.

---

## 9. ĐẶC TẢ TRANG ADMIN `/admin`

Giao diện admin: sidebar trái (thu gọn được), header có nút xem site / đăng xuất / chuyển ngôn ngữ nội
dung. Dùng shadcn/ui + TanStack Table. Tông màu admin sạch sẽ, trung tính hơn trang khách nhưng vẫn
giữ accent hồng.

### 9.1. Dashboard `/admin`
- 4 thẻ số liệu: Doanh thu hôm nay / tháng này, Số đơn chờ xử lý, Tổng sản phẩm, Đánh giá chờ duyệt.
- Biểu đồ đường doanh thu 30 ngày (Recharts, đọc từ view `v_revenue_daily`).
- Biểu đồ tròn đơn theo trạng thái.
- Bảng 10 đơn mới nhất (bấm vào mở chi tiết).
- Top 5 sản phẩm bán chạy.

### 9.2. Sản phẩm `/admin/san-pham`
- Bảng: ảnh thumbnail, tên (VI), danh mục, giá, tồn kho, nổi bật (toggle nhanh), trạng thái, thao tác.
- Tìm kiếm, lọc theo danh mục/trạng thái, chọn nhiều để xoá/ẩn hàng loạt.
- **Kéo-thả đổi `sort_order`** (dnd-kit) — lưu ngay.
- Form thêm/sửa (`/admin/san-pham/new`, `/admin/san-pham/[id]`):
  - Tab **Tiếng Việt** / **Tiếng Anh** cho các trường i18n.
  - Trình soạn thảo rich text cho mô tả (Tiptap hoặc textarea markdown — chọn đơn giản, sanitize kỹ).
  - **Uploader ảnh kéo-thả nhiều ảnh**, sắp xếp lại, đặt ảnh đại diện, xoá. Nén ảnh về WebP ≤ 1600px
    trước khi upload (dùng `browser-image-compression`).
  - Builder tuỳ chọn biến thể (size/vị) với `price_delta`.
  - Preview trực tiếp card sản phẩm bên phải khi đang nhập.
  - Nút "Lưu nháp" / "Xuất bản".

### 9.3. Danh mục `/admin/danh-muc`
CRUD + kéo-thả sắp xếp + upload ảnh + icon + slug tự sinh từ tên (bỏ dấu tiếng Việt).

### 9.4. Đơn hàng `/admin/don-hang`
- Bảng có bộ lọc: trạng thái, khoảng ngày, phương thức thanh toán, tìm theo mã/sđt/tên.
- Badge màu theo trạng thái. Cảnh báo đỏ cho đơn có `delivery_at` trong 24h tới.
- Chi tiết đơn `/admin/don-hang/[id]`:
  - Thông tin khách + địa chỉ + thời gian giao (có nút gọi/nhắn Zalo nhanh).
  - Danh sách món (từ `items_snapshot`).
  - **Đổi trạng thái** bằng dropdown → ghi thêm 1 mục vào `data.timeline`, gửi email cập nhật cho khách.
  - Đánh dấu "Đã thanh toán".
  - **Nút In hoá đơn** (trang in riêng khổ A5, `@media print`, có logo + QR).
  - Ghi chú nội bộ.
- Xuất CSV danh sách đơn theo bộ lọc.

### 9.5. Bánh đặt riêng `/admin/banh-dat-rieng`
Danh sách yêu cầu custom cake, xem ảnh mẫu, nhập giá báo + lời nhắn → gửi email cho khách,
chuyển thành đơn hàng chính thức bằng 1 nút.

### 9.6. **Theme Editor `/admin/giao-dien`** ⭐ (tính năng quan trọng nhất)
Bố cục 2 cột: **trái = bảng điều khiển, phải = preview website trong iframe** (`/?preview=1`), cập nhật
realtime khi chỉnh (postMessage hoặc reload iframe có debounce).

Các nhóm điều khiển:
1. **Thương hiệu:** upload logo, favicon, tên tiệm (VI/EN), slogan.
2. **Bảng màu:** color picker cho 7 màu chính + **các preset dựng sẵn** ("Hồng phấn", "Socola ấm",
   "Bạc hà mát", "Vàng bơ", "Tím lavender") — bấm 1 nút đổi cả bộ.
3. **Font chữ:** dropdown chọn từ danh sách Google Fonts hỗ trợ tiếng Việt (Be Vietnam Pro, Baloo 2,
   Quicksand, Nunito, Lora, Playfair Display).
4. **Bo góc & hiệu ứng:** slider `radius`, bật/tắt smooth scroll, parallax, confetti.
5. **Hero:** chọn biến thể, sửa tiêu đề/mô tả/CTA, đổi ảnh nền.
6. **Section trang chủ:** danh sách **kéo-thả đổi thứ tự** + công tắc bật/tắt + sửa props từng section
   (ví dụ số lượng sản phẩm hiển thị).
7. **Thanh thông báo:** bật/tắt, nội dung, link.
8. Nút **"Khôi phục mặc định"** (có xác nhận) và **"Lưu thay đổi"**.

Sau khi lưu → `revalidateTag('theme')` + `revalidateTag('settings')` → site đổi ngay.

### 9.7. Banner `/admin/banner`
CRUD slide: ảnh desktop + ảnh mobile riêng, tiêu đề, link, thời gian hiệu lực, kéo-thả sắp xếp.

### 9.8. Bài viết `/admin/bai-viet` & Trang tĩnh
CRUD blog (VI/EN), ảnh bìa, tags, ngày xuất bản, SEO. Sửa nội dung 4 trang tĩnh.

### 9.9. Đánh giá `/admin/danh-gia`
Danh sách review chờ duyệt → Duyệt / Từ chối. Khi duyệt, cập nhật `rating_avg` và `rating_count` của
sản phẩm cha (viết hàm SQL hoặc tính trong server action).

### 9.10. Mã giảm giá `/admin/ma-giam-gia`
CRUD voucher: mã, loại giảm (%/số tiền), giá trị, giảm tối đa, đơn tối thiểu, giới hạn lượt, thời hạn.
Hiện số lượt đã dùng.

### 9.11. Khách hàng `/admin/khach-hang`
Danh sách khách (gộp từ đơn hàng + `type='customer'`): tên, sđt, số đơn, tổng chi tiêu, đơn gần nhất.

### 9.12. Cài đặt `/admin/cai-dat`
- **Thông tin tiệm:** tên, hotline, email, địa chỉ, giờ mở cửa, nhúng bản đồ, mạng xã hội.
- **Tài khoản ngân hàng (cho VietQR):** chọn ngân hàng từ danh sách (tải từ `https://api.vietqr.io/v2/banks`
  hoặc nhúng file JSON tĩnh), số tài khoản, tên chủ TK, tiền tố nội dung CK.
  → Có nút **"Xem thử mã QR"** để admin kiểm tra ngay.
- **Vận chuyển:** phí ship, mốc freeship, ghi chú.
- **Email:** danh sách email nhận thông báo đơn mới (lưu ở bản ghi `setting/private`), nút "Gửi email thử".
- **SEO:** title/description mặc định, ảnh OG.

---

## 10. ĐA NGÔN NGỮ (i18n)

- Dùng `next-intl`, route `[locale]` với `vi` (mặc định, **không hiện prefix**) và `en` (`/en/...`).
- **Chuỗi giao diện tĩnh** → `messages/vi.json`, `messages/en.json`.
- **Nội dung động** (tên sản phẩm, mô tả, bài viết…) → object `{vi, en}` trong `data`.
  Helper `t(field, locale)` trả về `field[locale] ?? field.vi`.
- Admin có tab VI/EN cho mỗi trường i18n; **tiếng Việt bắt buộc, tiếng Anh tuỳ chọn**.
- Bộ chuyển ngôn ngữ trên header giữ nguyên trang hiện tại.
- `hreflang` alternate trong metadata; sitemap có cả 2 locale.
- Định dạng tiền: `vi` → `350.000₫`; `en` → `350,000 VND`. Ngày: `vi` → `20/08/2026`.

---

## 11. SEO & HIỆU NĂNG (dùng skill `openseo` + `Performance / Web Vitals`)

- Metadata động cho mọi trang (`generateMetadata`), có Open Graph + Twitter card.
- JSON-LD: `LocalBusiness` (trang chủ, lấy từ `setting`), `Product`, `BreadcrumbList`, `Article`, `FAQPage`.
- `app/sitemap.ts` sinh động từ Supabase (sản phẩm, danh mục, bài viết, cả 2 locale). `app/robots.ts`
  chặn `/admin` và `/api`.
- Ảnh: `next/image` với `sizes` đúng, `priority` cho ảnh hero, `placeholder="blur"`.
- Trang public dùng **Server Component + `revalidate`** (ISR), không fetch client trừ khi cần.
- Cache tag: `products`, `categories`, `theme`, `settings`, `posts` → admin lưu là revalidate đúng tag.
- **Mục tiêu Lighthouse (mobile) — điều kiện nghiệm thu:** Performance ≥ 90, Accessibility ≥ 95,
  Best Practices ≥ 95, SEO ≥ 95. LCP < 2.5s, CLS < 0.1, INP < 200ms.
- Kiểm tra bundle: `@next/bundle-analyzer`, JS trang chủ < 200KB gzip.
- Font: `next/font` với `display: swap`, subset `vietnamese`.

---

## 12. LỘ TRÌNH THỰC HIỆN (8 PHASE)

> **Quy tắc chung cho mọi phase:** kết thúc phase phải (1) chạy được `pnpm build` không lỗi,
> (2) không có lỗi TypeScript/ESLint, (3) chụp màn hình bằng `Browser / Visual Testing MCP` để tự kiểm,
> (4) ghi tóm tắt quyết định vào `codebase-memory-mcp`, (5) commit git với message rõ ràng.
> **Báo cáo cho người dùng sau mỗi phase và chờ xác nhận trước khi sang phase tiếp theo.**

### Phase 0 — Chuẩn bị (≈30 phút)
- [ ] Đọc lại toàn bộ file kế hoạch này. Gọi skill `superpowers` để lập todo chi tiết.
- [ ] Hỏi người dùng: `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `RESEND_API_KEY` (nếu có).
- [ ] `pnpm create next-app@latest` (TypeScript, Tailwind, App Router, ESLint, src? → **không** dùng `src/`).
- [ ] Cài dependencies, khởi tạo shadcn/ui, cấu hình Prettier, `.gitignore`, `git init` + commit đầu.
- [ ] Viết `CLAUDE.md`: tóm tắt ràng buộc R1–R10, quy ước đặt tên, cấu trúc `data` JSONB.

### Phase 1 — Nền tảng dữ liệu (≈1-2h)
- [ ] Chạy migration `0001_bakery_core.sql` qua `Supabase.apply_migration`.
- [ ] `Supabase.get_advisors` → sửa hết cảnh báo security/performance.
- [ ] `Supabase.generate_typescript_types` → `lib/supabase/database.types.ts`.
- [ ] Viết `lib/bakery/types.ts` + `schemas.ts` (Zod cho **tất cả** 15 type).
- [ ] Viết `lib/supabase/{client,server,admin}.ts`.
- [ ] Viết `lib/bakery/queries.ts` + `mutations.ts` (CRUD tổng quát theo type).
- [ ] Chạy seed dữ liệu mẫu (mục 4.6). Kiểm chứng bằng `execute_sql` đếm số dòng theo type.
- ✅ **DoD:** `select type, count(*) from bakery group by 1` trả về đủ các loại; anon key **không** insert được (test thử).

### Phase 2 — Design system & layout (≈2-3h)
- [ ] `globals.css` với `@theme` tokens; cơ chế inject CSS variable từ bản ghi `theme`.
- [ ] Font Google (Be Vietnam Pro + Baloo 2) qua `next/font`, subset vietnamese.
- [ ] `LenisProvider`, các component motion (`FadeIn`, `Parallax`, `Tilt3D`, `Marquee`, `Confetti`).
- [ ] Header (sticky, mini-cart drawer, language switcher) + Footer + MobileNav.
- [ ] Cấu hình `next-intl` + `messages/{vi,en}.json`.
- [ ] Trang **Storybook-lite** tại `/dev/ui` liệt kê mọi component để review nhanh (chỉ dev).
- ✅ **DoD:** đổi màu trong bản ghi `theme` bằng SQL → site đổi màu ngay. Skill `taste-skill` review đạt.

### Phase 3 — Trang khách hàng phần đọc (≈3-4h)
- [ ] Trang chủ render động theo `theme.sections` (đủ 11 section).
- [ ] `/san-pham` với filter/sort/search/phân trang trên URL.
- [ ] `/san-pham/[slug]` đầy đủ gallery, biến thể, tabs, review, sản phẩm liên quan.
- [ ] `/danh-muc/[slug]`, `/tin-tuc`, `/tin-tuc/[slug]`, `/gioi-thieu`, `/lien-he`.
- [ ] SEO: metadata + JSON-LD + sitemap + robots (skill `openseo`).
- ✅ **DoD:** Lighthouse trang chủ & chi tiết sản phẩm đạt ngưỡng mục 11. Screenshot desktop + mobile.

### Phase 4 — Giỏ hàng, đặt hàng, custom cake (≈3-4h)
- [ ] Zustand cart store + persist + mini-cart + animation "bay vào giỏ".
- [ ] `/gio-hang`, mã giảm giá (validate server), tính phí ship.
- [ ] `/thanh-toan` + `POST /api/orders` (tính giá lại ở server, sinh mã đơn, insert order + order_item).
- [ ] `/dat-hang-thanh-cong/[code]` + **QR VietQR** từ `setting.bank` + nút copy.
- [ ] Email xác nhận cho khách + email báo đơn cho admin (Resend). Nếu chưa có key → log ra console và
      ghi TODO, **không giả vờ đã gửi**.
- [ ] `/dat-banh-theo-yeu-cau` form nhiều bước + upload ảnh mẫu.
- [ ] `/tra-cuu-don-hang`.
- ✅ **DoD:** Playwright e2e: thêm giỏ → checkout COD → thấy mã đơn → đơn xuất hiện trong Supabase.
      Thử gửi `total` giả từ client → server phải bỏ qua và tính đúng.

### Phase 5 — Tài khoản khách hàng (≈1-2h)
- [ ] Supabase Auth (email/password), `@supabase/ssr` với cookie.
- [ ] `/tai-khoan` (thông tin, lịch sử đơn), `/tai-khoan/yeu-thich`.
- [ ] Gắn `user_id` vào đơn khi khách đã đăng nhập; guest checkout vẫn hoạt động.
- ✅ **DoD:** khách A không đọc được đơn của khách B (test bằng 2 tài khoản → RLS chặn).

### Phase 6 — Trang admin (≈4-6h, phần lớn nhất)
- [ ] `middleware.ts` + `/api/admin/login|logout` + cookie ký HMAC + rate limit.
- [ ] Layout admin + sidebar + bảo vệ route.
- [ ] Dashboard (Recharts, đọc `v_revenue_daily`).
- [ ] CRUD sản phẩm (form i18n, uploader ảnh, builder biến thể, kéo-thả).
- [ ] CRUD danh mục, banner, bài viết, trang tĩnh, voucher.
- [ ] Quản lý đơn hàng + đổi trạng thái + timeline + in hoá đơn + xuất CSV.
- [ ] Quản lý bánh đặt riêng + báo giá.
- [ ] Duyệt đánh giá + cập nhật `rating_avg`.
- [ ] **Theme Editor** đầy đủ (mục 9.6) — làm cuối cùng vì phức tạp nhất.
- [ ] Trang Cài đặt + cấu hình ngân hàng + xem thử QR + gửi email thử.
- ✅ **DoD:** Từ trang admin, đổi màu + đổi thứ tự section + thêm 1 sản phẩm mới → site khách cập nhật
      ngay mà **không sửa một dòng code nào**. Đây là tiêu chí nghiệm thu quan trọng nhất của dự án.

### Phase 7 — Kiểm thử, tối ưu, bàn giao (≈2-3h)
- [ ] Chạy skill `Security / OWASP` — sửa hết phát hiện.
- [ ] Chạy skill `Accessibility / WCAG` — sửa hết lỗi tương phản/aria/keyboard.
- [ ] Chạy skill `Performance / Web Vitals` — đạt ngưỡng mục 11.
- [ ] Chạy skill `impeccable` + `Karpathy` — refactor, xoá code chết, thống nhất đặt tên.
- [ ] Playwright e2e đầy đủ (mục 13). Vitest cho hàm tính giá, áp voucher, format tiền.
- [ ] Test responsive: 360px, 768px, 1024px, 1440px, 1920px (screenshot bằng Visual Testing MCP).
- [ ] Test trên `prefers-reduced-motion` và chế độ bàn phím.
- [ ] Viết `README.md`: cách chạy, biến môi trường, cách đổi mật khẩu admin, cách thêm sản phẩm,
      cách thay ảnh, cách đổi tài khoản ngân hàng. **Viết cho người không biết code.**
- [ ] Ghi toàn bộ kiến trúc vào `codebase-memory-mcp`.
- ✅ **DoD:** `pnpm build && pnpm start` chạy sạch; toàn bộ e2e xanh; README đủ để chủ tiệm tự vận hành.

---

## 13. KIỂM THỬ

### Playwright e2e (`tests/e2e/`) — tối thiểu các kịch bản:
1. Trang chủ tải, đủ số section theo cấu hình theme.
2. Tìm kiếm "banh kem" (không dấu) → ra kết quả có dấu.
3. Lọc theo danh mục + khoảng giá → URL thay đổi, kết quả đúng.
4. Thêm sản phẩm có biến thể vào giỏ → giá đúng theo `price_delta`.
5. Áp mã giảm giá hợp lệ / hết hạn / không đủ đơn tối thiểu.
6. Checkout COD → nhận mã đơn → tra cứu đơn bằng mã + 4 số cuối sđt.
7. Checkout chuyển khoản → thấy ảnh QR VietQR đúng số tiền.
8. Gửi form đặt bánh theo yêu cầu có upload ảnh.
9. Đăng nhập admin sai mật khẩu 6 lần → bị chặn.
10. Admin thêm sản phẩm → sản phẩm xuất hiện ở trang khách.
11. Admin đổi màu primary trong Theme Editor → CSS variable trên trang khách đổi theo.
12. Admin tắt section "blog" → trang chủ không còn section đó.
13. Chuyển ngôn ngữ sang EN → chuỗi giao diện đổi, nội dung fallback về VI khi thiếu EN.

### Vitest (`tests/unit/`)
- `calcOrderTotal` (nhiều món, biến thể, voucher %, voucher tiền, freeship).
- `validateCoupon` (hết hạn, hết lượt, chưa đủ min_order).
- `formatVND`, `slugify` tiếng Việt ("Bánh kem dâu tây" → "banh-kem-dau-tay").
- `t()` fallback i18n.

---

## 14. QUY ƯỚC CODE

- Tên file component: `PascalCase.tsx`; hook: `use-*.ts`; util: `kebab-case.ts`.
- **Server Component là mặc định.** Chỉ thêm `'use client'` khi thực sự cần state/effect/event.
- Không dùng `any`. Không dùng `@ts-ignore`. Không `console.log` sót lại trong code cuối.
- Mọi truy cập `data` JSONB phải qua Zod parse hoặc type guard — **không ép kiểu bừa**.
- Route và slug **tiếng Việt không dấu** (`/san-pham`, `/gio-hang`) để thân thiện SEO Việt Nam.
- Text hiển thị **không hard-code trong JSX** — lấy từ `messages/*.json` hoặc từ DB.
- Commit theo Conventional Commits: `feat(admin): them theme editor`.
- Mỗi phase = 1 nhánh git hoặc ít nhất 1 commit riêng.

---

## 15. NHỮNG ĐIỀU CLAUDE CODE **KHÔNG ĐƯỢC** LÀM

1. ❌ Tạo bảng mới trong Supabase (chỉ `bakery` + view/index/function/bucket).
2. ❌ Sửa hoặc xoá dữ liệu trong `categories`, `menu_items`, `admin_users`, `kho_iphone`.
3. ❌ Đưa `SUPABASE_SERVICE_ROLE_KEY` hay `ADMIN_PASSWORD` vào code client / biến `NEXT_PUBLIC_*`.
4. ❌ Commit file `.env.local`.
5. ❌ Tự bịa API key, tự bịa số tài khoản ngân hàng, tự bịa thông tin tiệm bánh có thật.
6. ❌ Dùng ảnh có bản quyền của thương hiệu khác.
7. ❌ Deploy lên bất kỳ đâu khi chưa được yêu cầu.
8. ❌ Tin bất kỳ giá trị tiền nào do client gửi lên.
9. ❌ Báo "đã xong" khi build lỗi hoặc test đỏ.
10. ❌ Đoán mò khi thiếu thông tin — **luôn hỏi người dùng**.

---

## 16. CÂU HỎI CLAUDE CODE CẦN HỎI TRƯỚC KHI BẮT ĐẦU

Hỏi gộp một lần ở Phase 0:

1. `SUPABASE_SERVICE_ROLE_KEY` là gì? (lấy ở Supabase Dashboard → Settings → API)
2. Mật khẩu admin muốn đặt là gì?
3. Có `RESEND_API_KEY` để gửi email không? Nếu không, có muốn dùng SMTP Gmail (cần app password) hay
   tạm thời bỏ qua email?
4. Tên tiệm bánh, hotline, địa chỉ, giờ mở cửa thật là gì? (nếu chưa có → dùng dữ liệu mẫu, admin sửa sau)
5. Thông tin tài khoản ngân hàng cho VietQR? (có thể để trống, nhập sau trong trang admin)
6. Có muốn bật đăng nhập Google cho khách hàng không?
7. Có logo/ảnh sản phẩm thật để dùng không, hay dùng ảnh placeholder?

---

## 17. TIÊU CHÍ NGHIỆM THU CUỐI CÙNG

Dự án được coi là **hoàn thành** khi tất cả các mục sau đúng:

- [ ] `pnpm build` và `pnpm start` chạy sạch, không warning nghiêm trọng.
- [ ] Toàn bộ dữ liệu nằm **duy nhất** trong bảng `public.bakery`.
- [ ] Trang chủ sinh động: có smooth scroll, parallax, animation khi cuộn, hover có phản hồi.
- [ ] Khách đặt được hàng COD và chuyển khoản (thấy QR đúng số tiền + nội dung).
- [ ] Khách gửi được yêu cầu đặt bánh riêng kèm ảnh mẫu.
- [ ] Khách đăng ký/đăng nhập và xem được lịch sử đơn của mình (và **chỉ** của mình).
- [ ] Admin đăng nhập bằng mật khẩu env, thêm/sửa/xoá sản phẩm & danh mục, upload ảnh.
- [ ] **Admin đổi màu, đổi font, đổi logo, bật/tắt và sắp xếp lại section trang chủ — site đổi ngay,
      không cần sửa code, không cần build lại.**
- [ ] Admin quản lý đơn, đổi trạng thái, in hoá đơn, xem dashboard doanh thu.
- [ ] Chuyển VI ↔ EN hoạt động trên toàn site.
- [ ] Lighthouse mobile: Perf ≥ 90, A11y ≥ 95, BP ≥ 95, SEO ≥ 95.
- [ ] Playwright e2e (13 kịch bản mục 13) xanh toàn bộ.
- [ ] `README.md` đủ chi tiết để chủ tiệm tự vận hành mà không cần lập trình viên.

---

**Hết kế hoạch. Bắt đầu từ Phase 0.**
