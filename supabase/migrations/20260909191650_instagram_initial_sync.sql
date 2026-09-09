create table public.instagram_media (
  id uuid primary key default gen_random_uuid(),
  social_account_id uuid not null references public.social_accounts (id) on delete cascade,
  provider_media_id text not null,
  caption text,
  media_type text not null,
  media_product_type text,
  media_url text,
  thumbnail_url text,
  permalink text,
  posted_at timestamptz not null,
  like_count bigint check (like_count is null or like_count >= 0),
  comments_count bigint check (comments_count is null or comments_count >= 0),
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint instagram_media_type_check check (
    media_type in ('IMAGE', 'VIDEO', 'CAROUSEL_ALBUM')
  ),
  constraint instagram_media_account_provider_key unique (social_account_id, provider_media_id)
);

create table public.instagram_media_insights (
  id uuid primary key default gen_random_uuid(),
  instagram_media_id uuid not null references public.instagram_media (id) on delete cascade,
  metric text not null,
  period text not null default 'lifetime',
  value numeric not null check (value >= 0),
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint instagram_media_insights_metric_key unique (instagram_media_id, metric, period)
);

create table public.instagram_account_insights (
  id uuid primary key default gen_random_uuid(),
  social_account_id uuid not null references public.social_accounts (id) on delete cascade,
  metric text not null,
  period text not null,
  value numeric not null check (value >= 0),
  end_time timestamptz not null,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint instagram_account_insights_point_key unique (
    social_account_id,
    metric,
    period,
    end_time
  )
);

create index instagram_media_account_posted_idx
on public.instagram_media (social_account_id, posted_at desc);

create index instagram_account_insights_account_time_idx
on public.instagram_account_insights (social_account_id, end_time desc);

create trigger instagram_media_set_updated_at
before update on public.instagram_media
for each row execute function private.set_updated_at();

create trigger instagram_media_insights_set_updated_at
before update on public.instagram_media_insights
for each row execute function private.set_updated_at();

create trigger instagram_account_insights_set_updated_at
before update on public.instagram_account_insights
for each row execute function private.set_updated_at();

alter table public.instagram_media enable row level security;
alter table public.instagram_media_insights enable row level security;
alter table public.instagram_account_insights enable row level security;

create policy "Members can read workspace Instagram media"
on public.instagram_media
for select
to authenticated
using (
  exists (
    select 1
    from public.social_accounts
    join public.social_connections
      on social_connections.id = social_accounts.connection_id
    join public.memberships
      on memberships.workspace_id = social_connections.workspace_id
    where social_accounts.id = instagram_media.social_account_id
      and memberships.user_id = (select auth.uid())
  )
);

create policy "Members can read workspace Instagram media insights"
on public.instagram_media_insights
for select
to authenticated
using (
  exists (
    select 1
    from public.instagram_media
    join public.social_accounts
      on social_accounts.id = instagram_media.social_account_id
    join public.social_connections
      on social_connections.id = social_accounts.connection_id
    join public.memberships
      on memberships.workspace_id = social_connections.workspace_id
    where instagram_media.id = instagram_media_insights.instagram_media_id
      and memberships.user_id = (select auth.uid())
  )
);

create policy "Members can read workspace Instagram account insights"
on public.instagram_account_insights
for select
to authenticated
using (
  exists (
    select 1
    from public.social_accounts
    join public.social_connections
      on social_connections.id = social_accounts.connection_id
    join public.memberships
      on memberships.workspace_id = social_connections.workspace_id
    where social_accounts.id = instagram_account_insights.social_account_id
      and memberships.user_id = (select auth.uid())
  )
);

revoke all on public.instagram_media from anon, authenticated;
revoke all on public.instagram_media_insights from anon, authenticated;
revoke all on public.instagram_account_insights from anon, authenticated;

grant select on public.instagram_media to authenticated;
grant select on public.instagram_media_insights to authenticated;
grant select on public.instagram_account_insights to authenticated;

grant select, insert, update, delete on public.instagram_media to service_role;
grant select, insert, update, delete on public.instagram_media_insights to service_role;
grant select, insert, update, delete on public.instagram_account_insights to service_role;
