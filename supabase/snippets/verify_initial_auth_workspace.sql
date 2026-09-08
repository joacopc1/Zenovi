-- Read-only verification for the initial Zenovi auth/workspace migration.
-- Safe to run more than once. It does not create, update, or delete anything.

with checks as (
  select
    'table public.profiles' as item,
    to_regclass('public.profiles') is not null as ok
  union all
  select 'table public.workspaces', to_regclass('public.workspaces') is not null
  union all
  select 'table public.memberships', to_regclass('public.memberships') is not null
  union all
  select 'index public.memberships_user_id_idx', to_regclass('public.memberships_user_id_idx') is not null
  union all
  select 'function private.set_updated_at', to_regprocedure('private.set_updated_at()') is not null
  union all
  select 'function private.handle_new_user', to_regprocedure('private.handle_new_user()') is not null
  union all
  select 'function private.handle_new_workspace', to_regprocedure('private.handle_new_workspace()') is not null
  union all
  select 'RLS public.profiles', coalesce((
    select relrowsecurity from pg_class where oid = to_regclass('public.profiles')
  ), false)
  union all
  select 'RLS public.workspaces', coalesce((
    select relrowsecurity from pg_class where oid = to_regclass('public.workspaces')
  ), false)
  union all
  select 'RLS public.memberships', coalesce((
    select relrowsecurity from pg_class where oid = to_regclass('public.memberships')
  ), false)
  union all
  select '6 RLS policies', (
    select count(*) = 6
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'workspaces', 'memberships')
  )
  union all
  select '4 lifecycle triggers', (
    select count(*) = 4
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where not t.tgisinternal
      and (
        (n.nspname = 'public' and c.relname in ('profiles', 'workspaces'))
        or (n.nspname = 'auth' and c.relname = 'users' and t.tgname = 'auth_user_created')
      )
      and t.tgname in (
        'profiles_set_updated_at',
        'workspaces_set_updated_at',
        'workspace_created',
        'auth_user_created'
      )
  )
)
select item, case when ok then 'OK' else 'MISSING' end as status
from checks
order by ok, item;
