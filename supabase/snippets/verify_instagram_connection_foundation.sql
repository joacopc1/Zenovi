with checks as (
  select
    'table public.social_connections' as item,
    to_regclass('public.social_connections') is not null as ok
  union all
  select
    'table public.social_accounts',
    to_regclass('public.social_accounts') is not null
  union all
  select
    'table public.instagram_oauth_attempts',
    to_regclass('public.instagram_oauth_attempts') is not null
  union all
  select
    'table public.instagram_connection_credentials',
    to_regclass('public.instagram_connection_credentials') is not null
  union all
  select
    'RLS public.social_connections',
    coalesce((select relrowsecurity from pg_class where oid = 'public.social_connections'::regclass), false)
  union all
  select
    'RLS public.social_accounts',
    coalesce((select relrowsecurity from pg_class where oid = 'public.social_accounts'::regclass), false)
  union all
  select
    '2 read-only RLS policies',
    (select count(*) = 2 from pg_policies where schemaname = 'public' and tablename in ('social_connections', 'social_accounts'))
  union all
  select
    'authenticated cannot write social_connections',
    not has_table_privilege('authenticated', 'public.social_connections', 'insert, update, delete')
  union all
  select
    'authenticated cannot write social_accounts',
    not has_table_privilege('authenticated', 'public.social_accounts', 'insert, update, delete')
  union all
  select
    'RLS public.instagram_oauth_attempts',
    coalesce((select relrowsecurity from pg_class where oid = 'public.instagram_oauth_attempts'::regclass), false)
  union all
  select
    'RLS public.instagram_connection_credentials',
    coalesce((select relrowsecurity from pg_class where oid = 'public.instagram_connection_credentials'::regclass), false)
  union all
  select
    'authenticated cannot access OAuth attempts',
    not has_table_privilege('authenticated', 'public.instagram_oauth_attempts', 'select, insert, update, delete')
  union all
  select
    'authenticated cannot access encrypted credentials',
    not has_table_privilege('authenticated', 'public.instagram_connection_credentials', 'select, insert, update, delete')
  union all
  select
    'service_role can manage OAuth attempts',
    has_table_privilege('service_role', 'public.instagram_oauth_attempts', 'select, insert, update, delete')
  union all
  select
    'service_role can manage encrypted credentials',
    has_table_privilege('service_role', 'public.instagram_connection_credentials', 'select, insert, update, delete')
)
select item, case when ok then 'OK' else 'FAIL' end as status
from checks
order by item;
