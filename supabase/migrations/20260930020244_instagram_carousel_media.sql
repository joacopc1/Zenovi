alter table public.instagram_media
add column media_width integer,
add column media_height integer,
add constraint instagram_media_dimensions_pair_check check (
  (media_width is null and media_height is null)
  or (media_width between 1 and 10000 and media_height between 1 and 10000)
);

create table public.instagram_media_children (
  id uuid primary key default gen_random_uuid(),
  instagram_media_id uuid not null references public.instagram_media (id) on delete cascade,
  provider_media_id text not null,
  position smallint not null check (position between 0 and 19),
  media_type text not null check (media_type in ('IMAGE', 'VIDEO')),
  media_url text,
  thumbnail_url text,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint instagram_media_children_parent_position_key unique (instagram_media_id, position),
  constraint instagram_media_children_parent_provider_key unique (instagram_media_id, provider_media_id)
);

create index instagram_media_children_parent_idx
on public.instagram_media_children (instagram_media_id, position);

create trigger instagram_media_children_set_updated_at
before update on public.instagram_media_children
for each row execute function private.set_updated_at();

alter table public.instagram_media_children enable row level security;

create policy "Members can read workspace Instagram carousel media"
on public.instagram_media_children
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
    where instagram_media.id = instagram_media_children.instagram_media_id
      and memberships.user_id = (select auth.uid())
  )
);

revoke all on public.instagram_media_children from anon, authenticated;
grant select on public.instagram_media_children to authenticated;
grant select, insert, update, delete on public.instagram_media_children to service_role;
