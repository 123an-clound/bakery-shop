-- =========================================================
-- 0001_bakery_core.sql  —  Bakery Store: single-table model
-- Applied via Supabase MCP apply_migration on 2026-08-20.
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
