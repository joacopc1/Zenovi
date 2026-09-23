create table public.brand_profiles (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  description text not null default '',
  niche text not null default '',
  positioning text not null default '',
  tone text not null default '',
  own_words text[] not null default '{}',
  avoided_words text[] not null default '{}',
  differentiators text[] not null default '{}',
  mechanism text not null default '',
  allowed_promises text[] not null default '{}',
  proof text[] not null default '{}',
  objective text not null default '',
  primary_cta text not null default '',
  conversion_channels text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  kind text not null default 'service' check (kind in ('service', 'infoproduct', 'program', 'other')),
  description text not null default '',
  price_cents bigint check (price_cents is null or price_cents >= 0),
  currency text not null default 'USD' check (char_length(currency) between 1 and 8),
  modality text not null default '',
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index offers_workspace_id_idx on public.offers (workspace_id);

create table public.audience_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null default '',
  description text not null default '',
  pains text[] not null default '{}',
  desires text[] not null default '{}',
  objections text[] not null default '{}',
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index audience_profiles_workspace_id_idx on public.audience_profiles (workspace_id);

create trigger brand_profiles_set_updated_at
before update on public.brand_profiles
for each row execute function private.set_updated_at();

create trigger offers_set_updated_at
before update on public.offers
for each row execute function private.set_updated_at();

create trigger audience_profiles_set_updated_at
before update on public.audience_profiles
for each row execute function private.set_updated_at();

alter table public.brand_profiles enable row level security;
alter table public.offers enable row level security;
alter table public.audience_profiles enable row level security;

create policy "Members can read workspace brand profile"
on public.brand_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = brand_profiles.workspace_id
      and memberships.user_id = (select auth.uid())
  )
);

create policy "Members can create workspace brand profile"
on public.brand_profiles
for insert
to authenticated
with check (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = brand_profiles.workspace_id
      and memberships.user_id = (select auth.uid())
  )
);

create policy "Members can update workspace brand profile"
on public.brand_profiles
for update
to authenticated
using (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = brand_profiles.workspace_id
      and memberships.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = brand_profiles.workspace_id
      and memberships.user_id = (select auth.uid())
  )
);

create policy "Members can read workspace offers"
on public.offers
for select
to authenticated
using (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = offers.workspace_id
      and memberships.user_id = (select auth.uid())
  )
);

create policy "Members can create workspace offers"
on public.offers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = offers.workspace_id
      and memberships.user_id = (select auth.uid())
  )
);

create policy "Members can update workspace offers"
on public.offers
for update
to authenticated
using (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = offers.workspace_id
      and memberships.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = offers.workspace_id
      and memberships.user_id = (select auth.uid())
  )
);

create policy "Members can delete workspace offers"
on public.offers
for delete
to authenticated
using (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = offers.workspace_id
      and memberships.user_id = (select auth.uid())
  )
);

create policy "Members can read workspace audience profiles"
on public.audience_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = audience_profiles.workspace_id
      and memberships.user_id = (select auth.uid())
  )
);

create policy "Members can create workspace audience profiles"
on public.audience_profiles
for insert
to authenticated
with check (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = audience_profiles.workspace_id
      and memberships.user_id = (select auth.uid())
  )
);

create policy "Members can update workspace audience profiles"
on public.audience_profiles
for update
to authenticated
using (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = audience_profiles.workspace_id
      and memberships.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = audience_profiles.workspace_id
      and memberships.user_id = (select auth.uid())
  )
);

create policy "Members can delete workspace audience profiles"
on public.audience_profiles
for delete
to authenticated
using (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = audience_profiles.workspace_id
      and memberships.user_id = (select auth.uid())
  )
);

revoke all on public.brand_profiles from anon, authenticated;
revoke all on public.offers from anon, authenticated;
revoke all on public.audience_profiles from anon, authenticated;

grant select, insert, update on public.brand_profiles to authenticated;
grant select, insert, update, delete on public.offers to authenticated;
grant select, insert, update, delete on public.audience_profiles to authenticated;
