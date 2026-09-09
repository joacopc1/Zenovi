create table public.social_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  provider text not null default 'instagram',
  status text not null default 'oauth_started',
  last_error_code text,
  last_error_at timestamptz,
  connected_at timestamptz,
  disconnected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_connections_provider_check check (provider = 'instagram'),
  constraint social_connections_status_check check (
    status in (
      'oauth_started',
      'meta_authorized',
      'callback_validated',
      'token_verified',
      'account_resolved',
      'initial_sync_queued',
      'syncing',
      'connected',
      'action_required',
      'failed'
    )
  ),
  constraint social_connections_workspace_provider_key unique (workspace_id, provider)
);

create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null unique references public.social_connections (id) on delete cascade,
  provider text not null default 'instagram',
  provider_account_id text not null,
  username text not null,
  account_type text not null,
  profile_picture_url text,
  media_count bigint check (media_count is null or media_count >= 0),
  followers_count bigint check (followers_count is null or followers_count >= 0),
  follows_count bigint check (follows_count is null or follows_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_accounts_provider_check check (provider = 'instagram'),
  constraint social_accounts_account_type_check check (account_type in ('BUSINESS', 'MEDIA_CREATOR')),
  constraint social_accounts_provider_account_key unique (provider, provider_account_id)
);

create table private.oauth_attempts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'instagram',
  state_digest bytea not null unique,
  redirect_path text not null default '/onboarding/instagram',
  expires_at timestamptz not null,
  consumed_at timestamptz,
  failure_code text,
  created_at timestamptz not null default now(),
  constraint oauth_attempts_provider_check check (provider = 'instagram'),
  constraint oauth_attempts_redirect_path_check check (
    redirect_path like '/%'
    and redirect_path not like '//%'
  ),
  constraint oauth_attempts_expiry_check check (expires_at > created_at)
);

create table private.social_connection_credentials (
  connection_id uuid primary key references public.social_connections (id) on delete cascade,
  access_token_ciphertext bytea not null,
  access_token_iv bytea not null,
  access_token_auth_tag bytea not null,
  encryption_key_version smallint not null default 1 check (encryption_key_version > 0),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index oauth_attempts_workspace_user_created_idx
on private.oauth_attempts (workspace_id, user_id, created_at desc);

create index oauth_attempts_expires_at_idx
on private.oauth_attempts (expires_at)
where consumed_at is null;

create trigger social_connections_set_updated_at
before update on public.social_connections
for each row execute function private.set_updated_at();

create trigger social_accounts_set_updated_at
before update on public.social_accounts
for each row execute function private.set_updated_at();

create trigger social_connection_credentials_set_updated_at
before update on private.social_connection_credentials
for each row execute function private.set_updated_at();

alter table public.social_connections enable row level security;
alter table public.social_accounts enable row level security;

create policy "Members can read workspace connections"
on public.social_connections
for select
to authenticated
using (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = social_connections.workspace_id
      and memberships.user_id = (select auth.uid())
  )
);

create policy "Members can read workspace social accounts"
on public.social_accounts
for select
to authenticated
using (
  exists (
    select 1
    from public.social_connections
    join public.memberships
      on memberships.workspace_id = social_connections.workspace_id
    where social_connections.id = social_accounts.connection_id
      and memberships.user_id = (select auth.uid())
  )
);

revoke all on public.social_connections from anon, authenticated;
revoke all on public.social_accounts from anon, authenticated;
revoke all on private.oauth_attempts from public, anon, authenticated;
revoke all on private.social_connection_credentials from public, anon, authenticated;

grant select on public.social_connections to authenticated;
grant select on public.social_accounts to authenticated;
