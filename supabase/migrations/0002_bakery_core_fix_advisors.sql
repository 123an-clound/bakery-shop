-- =========================================================
-- 0002_bakery_core_fix_advisors.sql
-- Fix advisor warnings for objects owned by bakery-store only.
-- (Không đụng categories/menu_items/admin_users — thuộc dự án khác, theo R4.)
-- Applied via Supabase MCP apply_migration on 2026-08-20.
-- =========================================================

-- 1) function_search_path_mutable: pin search_path cho các function của bakery
alter function public.bakery_unaccent(text) set search_path = extensions, pg_catalog;
alter function public.bakery_touch_updated_at() set search_path = pg_catalog, public;
alter function public.bakery_next_order_code() set search_path = pg_catalog, public;

-- 2) auth_rls_initplan + multiple_permissive_policies: gộp 3 policy SELECT thành 1,
--    và bọc auth.uid() bằng (select ...) để không re-evaluate theo từng dòng.
drop policy if exists bakery_public_read     on public.bakery;
drop policy if exists bakery_reviews_read    on public.bakery;
drop policy if exists bakery_own_orders_read on public.bakery;

create policy bakery_select on public.bakery
  for select to anon, authenticated
  using (
    (status = 'active' and type in ('setting','theme','category','product','banner','page','post'))
    or (type = 'review' and status = 'approved')
    or (
      type in ('order','order_item','custom_cake','favorite','customer')
      and data->>'user_id' = (select auth.uid())::text
    )
  );
