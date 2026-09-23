-- Una métrica por Reel y día. Meta entrega los insights de piezas como acumulados
-- lifetime; conservar una foto diaria permite derivar cuánto sumó cada día sin
-- inventar una serie retroactiva.
create table public.instagram_media_insight_snapshots (
  id uuid primary key default gen_random_uuid(),
  instagram_media_id uuid not null references public.instagram_media (id) on delete cascade,
  metric text not null,
  value numeric not null check (value >= 0),
  observed_on date not null,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint instagram_media_insight_snapshots_point_key unique (
    instagram_media_id,
    metric,
    observed_on
  )
);

create index instagram_media_insight_snapshots_media_time_idx
on public.instagram_media_insight_snapshots (
  instagram_media_id,
  metric,
  observed_on desc
);

create trigger instagram_media_insight_snapshots_set_updated_at
before update on public.instagram_media_insight_snapshots
for each row execute function private.set_updated_at();

alter table public.instagram_media_insight_snapshots enable row level security;

create policy "Members can read workspace Instagram media insight snapshots"
on public.instagram_media_insight_snapshots
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
    where instagram_media.id = instagram_media_insight_snapshots.instagram_media_id
      and memberships.user_id = (select auth.uid())
  )
);

revoke all on public.instagram_media_insight_snapshots from anon, authenticated;
grant select on public.instagram_media_insight_snapshots to authenticated;
grant select, insert, update, delete on public.instagram_media_insight_snapshots to service_role;

