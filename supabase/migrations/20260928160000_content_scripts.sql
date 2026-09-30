-- El guion es un artefacto incluido y reutilizable, separado del análisis estratégico.
-- Se genera a demanda una sola vez; el análisis posterior reutiliza su transcripción.
create table if not exists public.content_scripts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  instagram_media_id uuid not null references public.instagram_media (id) on delete cascade,
  status text not null default 'queued',
  pipeline_version text,
  result jsonb,
  failure_reason text,
  can_retry boolean not null default true,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_scripts_status_check check (
    status in ('queued', 'running', 'ready', 'failed')
  ),
  constraint content_scripts_ready_has_result check (status <> 'ready' or result is not null),
  constraint content_scripts_failed_has_reason check (
    status <> 'failed' or failure_reason is not null
  )
);

create unique index if not exists content_scripts_media_unique
  on public.content_scripts (instagram_media_id);

create trigger content_scripts_set_updated_at
before update on public.content_scripts
for each row execute function private.set_updated_at();

alter table public.content_scripts enable row level security;

create policy "Members can read workspace content scripts"
on public.content_scripts
for select
to authenticated
using (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = content_scripts.workspace_id
      and memberships.user_id = (select auth.uid())
  )
);

create policy "Members can request workspace content scripts"
on public.content_scripts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = content_scripts.workspace_id
      and memberships.user_id = (select auth.uid())
  )
);

revoke all on public.content_scripts from anon, authenticated;
grant select, insert on public.content_scripts to authenticated;
grant select, insert, update, delete on public.content_scripts to service_role;
