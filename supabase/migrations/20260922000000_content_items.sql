create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title text not null default '',
  content_type text not null default '',
  format text not null default 'reel' check (format in ('reel', 'story', 'post')),
  status text not null default 'idea' check (status in ('idea', 'guion', 'produccion', 'publicada')),
  target_date date,
  reference_url text,
  hook text not null default '',
  development text not null default '',
  cta text not null default '',
  source text not null default 'manual' check (source in ('manual', 'director')),
  linked_media_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index content_items_workspace_status_idx on public.content_items (workspace_id, status);
create index content_items_workspace_date_idx on public.content_items (workspace_id, target_date);

create trigger content_items_set_updated_at
before update on public.content_items
for each row execute function private.set_updated_at();

alter table public.content_items enable row level security;

create policy "Members can read workspace content items"
on public.content_items
for select
to authenticated
using (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = content_items.workspace_id
      and memberships.user_id = (select auth.uid())
  )
);

create policy "Members can create workspace content items"
on public.content_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = content_items.workspace_id
      and memberships.user_id = (select auth.uid())
  )
);

create policy "Members can update workspace content items"
on public.content_items
for update
to authenticated
using (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = content_items.workspace_id
      and memberships.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = content_items.workspace_id
      and memberships.user_id = (select auth.uid())
  )
);

create policy "Members can delete workspace content items"
on public.content_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = content_items.workspace_id
      and memberships.user_id = (select auth.uid())
  )
);

revoke all on public.content_items from anon, authenticated;

grant select, insert, update, delete on public.content_items to authenticated;
