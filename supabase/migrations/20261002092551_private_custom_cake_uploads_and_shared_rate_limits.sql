-- Customer-provided cake reference images must not share the public catalog bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'custom-cake-private',
  'custom-cake-private',
  false,
  5242880,
  array['image/webp', 'image/png', 'image/jpeg', 'image/avif']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- No anon/authenticated Storage policies are added for this private bucket.

-- Shared fixed-window counters are keyed by a server-side HMAC. Raw client IPs
-- are never written to this table. service_role is the sole API role with access.
create table if not exists public.rate_limit_windows (
  bucket_hash text not null check (bucket_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  hit_count integer not null check (hit_count > 0),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (bucket_hash, window_started_at)
);

create index if not exists rate_limit_windows_updated_at_idx
  on public.rate_limit_windows (updated_at);

alter table public.rate_limit_windows enable row level security;
revoke all on table public.rate_limit_windows from public, anon, authenticated;
grant select, insert, update, delete on table public.rate_limit_windows to service_role;
create policy rate_limit_windows_service_role_all
  on public.rate_limit_windows for all to service_role
  using (true) with check (true);

create or replace function public.consume_rate_limit(
  p_bucket_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_window_start timestamptz;
  v_count integer;
begin
  if p_bucket_hash is null or p_bucket_hash !~ '^[0-9a-f]{64}$'
     or p_limit is null or p_limit < 1 or p_limit > 100000
     or p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid rate limit arguments' using errcode = '22023';
  end if;

  v_window_start := pg_catalog.to_timestamp(
    pg_catalog.floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limit_windows as current_window
    (bucket_hash, window_started_at, hit_count, updated_at)
  values (p_bucket_hash, v_window_start, 1, v_now)
  on conflict (bucket_hash, window_started_at) do update
    set hit_count = least(current_window.hit_count + 1, p_limit + 1),
        updated_at = excluded.updated_at
  returning hit_count into v_count;

  -- Low-frequency bounded cleanup prevents old client hashes accumulating forever.
  if pg_catalog.random() < 0.001 then
    delete from public.rate_limit_windows
    where ctid in (
      select stale.ctid
      from public.rate_limit_windows as stale
      where stale.updated_at < v_now - interval '2 days'
      order by stale.updated_at
      limit 500
    );
  end if;

  return pg_catalog.jsonb_build_object(
    'allowed', v_count <= p_limit,
    'retry_after_seconds', greatest(
      1,
      pg_catalog.ceil(extract(epoch from (v_window_start + pg_catalog.make_interval(secs => p_window_seconds) - v_now)))::integer
    )
  );
end;
$$;

create or replace function public.clear_rate_limit(p_bucket_hash text)
returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.rate_limit_windows where bucket_hash = p_bucket_hash;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.clear_rate_limit(text) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
grant execute on function public.clear_rate_limit(text) to service_role;
