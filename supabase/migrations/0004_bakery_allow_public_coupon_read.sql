-- =========================================================
-- 0004_bakery_allow_public_coupon_read.sql
-- Bug that: RLS chua cho phep doc 'coupon' cong khai (migration 0002 quen
-- liet ke trong danh sach type doc cong khai), khien khach hang khong the
-- ap dung ma giam gia hop le luc checkout (getActiveCouponByCode dung anon
-- client luon tra ve null). Phat hien qua kiem thu trinh duyet that o Phase 4.
-- Applied via Supabase MCP apply_migration on 2026-08-20.
-- =========================================================

drop policy if exists bakery_select on public.bakery;

create policy bakery_select on public.bakery
  for select to anon, authenticated
  using (
    (status = 'active' and type in ('setting','theme','category','product','banner','page','post','coupon'))
    or (type = 'review' and status = 'approved')
    or (
      type in ('order','order_item','custom_cake','favorite','customer')
      and data->>'user_id' = (select auth.uid())::text
    )
  );
