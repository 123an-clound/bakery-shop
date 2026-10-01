-- Additive, bakery-owned RPCs only. Apply after order_integrity, in a sandbox first.
create or replace function public.bakery_quote_custom_cake(p_id bigint, p_price bigint, p_reply text)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, public as $$
declare cake public.bakery%rowtype;
begin
  select * into cake from public.bakery where type = 'custom_cake' and id = p_id for update;
  if not found then raise exception 'not_found'; end if;
  if cake.status not in ('new','quoted') then raise exception 'invalid_transition'; end if;
  if p_price is null or p_price < 0 or p_price > 9007199254740991 or p_reply is null or length(p_reply) > 2000 then
    raise exception 'invalid_input';
  end if;
  update public.bakery set status = 'quoted',
    data = data || jsonb_build_object('quoted_price',p_price,'admin_reply',p_reply) where id = p_id;
  return jsonb_build_object('id',p_id);
end $$;
revoke all on function public.bakery_quote_custom_cake(bigint,bigint,text) from public, anon, authenticated;
grant execute on function public.bakery_quote_custom_cake(bigint,bigint,text) to service_role;

create or replace function public.bakery_convert_custom_cake(
  p_id bigint, p_expected jsonb, p_order jsonb, p_setting jsonb
) returns jsonb language plpgsql security invoker set search_path = pg_catalog, public as $$
declare
  cake public.bakery%rowtype;
  settings public.bakery%rowtype;
  existing_id bigint;
  new_id bigint;
  code text;
  item jsonb;
begin
  -- Same lock as normal checkout: order-code allocation cannot race that path.
  perform pg_advisory_xact_lock(hashtextextended('bakery.checkout', 0));
  select * into cake from public.bakery where type = 'custom_cake' and id = p_id for update;
  if not found then raise exception 'not_found'; end if;
  select id into existing_id from public.bakery where type = 'order' and slug = 'custom-cake-' || p_id::text;
  if found then return jsonb_build_object('id',existing_id,'created',false); end if;
  -- Legacy accepted requests have no reliable link: never manufacture a second order.
  if cake.status <> 'quoted' then raise exception 'invalid_transition'; end if;
  if cake.data is distinct from p_expected then raise exception 'quote_changed'; end if;
  if cake.data->>'quoted_price' is null then raise exception 'not_quoted'; end if;
  if (cake.data->>'quoted_price')::numeric is distinct from (p_order->>'subtotal')::numeric
    or (p_order->>'total')::numeric <> (p_order->>'subtotal')::numeric + (p_order->>'shipping_fee')::numeric
    or p_order->>'payment_status' is distinct from 'unpaid' then raise exception 'invalid_input'; end if;
  select * into settings from public.bakery where type = 'setting' and slug = 'site' and status = 'active' for share;
  if not found or settings.data is distinct from p_setting then raise exception 'cart_changed'; end if;

  code := public.bakery_next_order_code();
  insert into public.bakery(type,slug,status,data) values
    ('order','custom-cake-' || p_id::text,'pending',p_order || jsonb_build_object('code',code)) returning id into new_id;
  for item in select value from jsonb_array_elements(p_order->'items_snapshot') loop
    insert into public.bakery(type,parent_id,data) values ('order_item',new_id,item - 'image');
  end loop;
  update public.bakery set status = 'accepted', data = data || jsonb_build_object('order_id',new_id) where id = p_id;
  return jsonb_build_object('id',new_id,'created',true);
end $$;
revoke all on function public.bakery_convert_custom_cake(bigint,jsonb,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.bakery_convert_custom_cake(bigint,jsonb,jsonb,jsonb) to service_role;
