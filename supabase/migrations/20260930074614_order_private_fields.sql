-- JSONB row-level security cannot hide individual internal fields.
-- Orders are now read through the authenticated server DAL, which checks
-- ownership and strips internal_note/request_hash/reserved_product_ids.
-- No rows are changed; all other existing public/owned content rules remain.
drop policy if exists bakery_select on public.bakery;
create policy bakery_select on public.bakery for select to anon, authenticated using (
  (status = 'active' and type in ('setting','theme','category','product','banner','page','post','coupon'))
  or (type = 'review' and status = 'approved')
  or (type in ('custom_cake','favorite','customer') and data->>'user_id' = (select auth.uid())::text)
);
