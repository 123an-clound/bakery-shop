-- Additive migration. Apply to a sandbox first; no existing rows are rewritten.
-- Only the trusted server may call these RPCs. Both use the existing single table.
create or replace function public.bakery_commit_order(
  p_request_id uuid, p_request_hash text, p_order jsonb,
  p_products jsonb, p_coupon jsonb, p_setting jsonb
) returns jsonb language plpgsql security invoker
set search_path = pg_catalog, public as $$
declare
  existing public.bakery%rowtype;
  current_row public.bakery%rowtype;
  expected jsonb;
  item jsonb;
  reserved jsonb := '[]'::jsonb;
  new_id bigint;
  order_code text;
  quantity integer;
begin
  -- Serialize checkout commits for this single shop, including code generation.
  perform pg_advisory_xact_lock(hashtextextended('bakery.checkout', 0));
  select * into existing from public.bakery
    where type = 'order' and slug = 'checkout-' || p_request_id::text;
  if found then
    if existing.data->>'request_hash' is distinct from p_request_hash then
      raise exception 'idempotency_conflict';
    end if;
    return jsonb_build_object('code', existing.data->>'code', 'total', existing.data->'total', 'created', false);
  end if;

  -- Lock the live rows, then compare to the server's pricing snapshot.
  -- Any edit between pricing and commit fails closed; no stale prices/coupons.
  for expected in select value from jsonb_array_elements(p_products) order by (value->>'id')::bigint loop
    select * into current_row from public.bakery
      where type = 'product' and id = (expected->>'id')::bigint for update;
    if not found or current_row.status <> 'active' or current_row.data is distinct from expected->'data' then
      raise exception 'cart_changed';
    end if;
    select sum((value->>'qty')::integer) into quantity from jsonb_array_elements(p_order->'items_snapshot')
      where (value->>'product_id')::bigint = current_row.id;
    if quantity is null or quantity <= 0 then raise exception 'invalid_input'; end if;
    if current_row.data->>'stock' is not null then
      if (current_row.data->>'stock')::integer < quantity then raise exception 'out_of_stock'; end if;
      update public.bakery set data = jsonb_set(data, '{stock}', to_jsonb((data->>'stock')::integer - quantity))
        where id = current_row.id;
      reserved := reserved || to_jsonb(current_row.id);
    end if;
  end loop;

  if p_coupon is not null and p_coupon <> 'null'::jsonb then
    select * into current_row from public.bakery where type = 'coupon' and id = (p_coupon->>'id')::bigint for update;
    if not found or current_row.status <> 'active' or current_row.data is distinct from p_coupon->'data' then
      raise exception 'coupon_invalid';
    end if;
    if current_row.data->>'usage_limit' is not null and
      coalesce((current_row.data->>'used_count')::integer, 0) >= (current_row.data->>'usage_limit')::integer then
      raise exception 'coupon_invalid';
    end if;
    update public.bakery set data = jsonb_set(data, '{used_count}', to_jsonb(coalesce((data->>'used_count')::integer, 0) + 1))
      where id = current_row.id;
  end if;

  select * into current_row from public.bakery where type = 'setting' and slug = 'site' and status = 'active' for share;
  if not found or current_row.data is distinct from p_setting then raise exception 'cart_changed'; end if;

  order_code := public.bakery_next_order_code();
  p_order := p_order || jsonb_build_object('code', order_code, 'request_hash', p_request_hash, 'reserved_product_ids', reserved);
  insert into public.bakery(type, slug, status, data)
    values ('order', 'checkout-' || p_request_id::text, 'pending', p_order) returning id into new_id;
  for item in select value from jsonb_array_elements(p_order->'items_snapshot') loop
    insert into public.bakery(type, parent_id, data) values ('order_item', new_id, item - 'image');
  end loop;
  return jsonb_build_object('code', order_code, 'total', p_order->'total', 'created', true);
end $$;
revoke all on function public.bakery_commit_order(uuid,text,jsonb,jsonb,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.bakery_commit_order(uuid,text,jsonb,jsonb,jsonb,jsonb) to service_role;

-- Merge admin order changes under a row lock: parallel payment/note/status edits
-- cannot overwrite each other's data. Cancellation restores only reserved stock.
create or replace function public.bakery_update_order(p_id bigint, p_patch jsonb)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, public as $$
declare
  current_row public.bakery%rowtype;
  next_status text;
  item record;
  next_data jsonb;
  stages text[] := array['pending','confirmed','baking','delivering','completed'];
begin
  perform pg_advisory_xact_lock(hashtextextended('bakery.checkout', 0));
  select * into current_row from public.bakery where id = p_id and type = 'order' for update;
  if not found then raise exception 'not_found'; end if;
  next_status := coalesce(p_patch->>'status', current_row.status);
  next_data := current_row.data;
  if p_patch ? 'status' and next_status <> current_row.status then
    if next_status not in ('pending','confirmed','baking','delivering','completed','cancelled')
      or current_row.status in ('completed','cancelled')
      or (next_status <> 'cancelled' and coalesce(array_position(stages,next_status),0) <= coalesce(array_position(stages,current_row.status),0)) then
      raise exception 'invalid_transition';
    end if;
    next_data := jsonb_set(next_data, '{timeline}', coalesce(next_data->'timeline','[]'::jsonb) || jsonb_build_array(
      jsonb_build_object('status', next_status, 'at', now(), 'by', 'admin', 'note', coalesce(p_patch->>'note',''))));
    if next_status = 'cancelled' then
      for item in select (value->>'product_id')::bigint as id, sum((value->>'qty')::integer)::integer as qty
        from jsonb_array_elements(next_data->'items_snapshot')
        where next_data->'reserved_product_ids' @> jsonb_build_array((value->>'product_id')::bigint)
        group by (value->>'product_id')::bigint order by (value->>'product_id')::bigint loop
        update public.bakery set data = jsonb_set(data,'{stock}',to_jsonb((data->>'stock')::integer + item.qty))
          where type = 'product' and id = item.id and data->>'stock' is not null;
      end loop;
      next_data := next_data - 'reserved_product_ids';
    end if;
  end if;
  if p_patch ? 'payment_status' then
    if p_patch->>'payment_status' <> 'paid' or current_row.status = 'cancelled' or next_data->>'payment_status' = 'refunded' then
      raise exception 'invalid_transition';
    end if;
    next_data := jsonb_set(next_data,'{payment_status}','"paid"'::jsonb);
  end if;
  if p_patch ? 'internal_note' then
    if length(p_patch->>'internal_note') > 2000 then raise exception 'invalid_input'; end if;
    next_data := jsonb_set(next_data,'{internal_note}',p_patch->'internal_note');
  end if;
  update public.bakery set status = next_status, data = next_data where id = p_id;
  return jsonb_build_object('changed', next_data is distinct from current_row.data, 'data', next_data, 'status', next_status);
end $$;
revoke all on function public.bakery_update_order(bigint,jsonb) from public, anon, authenticated;
grant execute on function public.bakery_update_order(bigint,jsonb) to service_role;
