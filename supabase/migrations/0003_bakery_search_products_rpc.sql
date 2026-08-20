-- =========================================================
-- 0003_bakery_search_products_rpc.sql
-- Full-text search RPC — uses index bakery_product_search_idx from 0001.
-- security invoker (no SECURITY DEFINER) — runs as the caller (anon/
-- authenticated), so it still respects RLS policy bakery_select.
-- Applied via Supabase MCP apply_migration on 2026-08-20.
-- =========================================================

create or replace function public.search_products(search_query text, result_limit int default 20)
returns setof public.bakery
language sql stable
set search_path = pg_catalog, public
as $$
  select *
  from public.bakery
  where type = 'product'
    and status = 'active'
    and to_tsvector('simple', public.bakery_unaccent(
          coalesce(data->'name'->>'vi','') || ' ' ||
          coalesce(data->'name'->>'en','') || ' ' ||
          coalesce(data->'short_description'->>'vi','')))
        @@ plainto_tsquery('simple', public.bakery_unaccent(search_query))
  order by sort_order, id desc
  limit result_limit;
$$;
