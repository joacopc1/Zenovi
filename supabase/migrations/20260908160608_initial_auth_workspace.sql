create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  locale text not null default 'es' check (char_length(locale) between 2 and 10),
  timezone text not null default 'America/Montevideo' check (char_length(timezone) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(trim(display_name)) between 1 and 80)
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_path text,
  timezone text not null default 'America/Montevideo' check (char_length(timezone) between 1 and 100),
  created_by uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspaces_name_length check (char_length(trim(name)) between 1 and 80)
);

create table public.memberships (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role = 'owner'),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index memberships_user_id_idx on public.memberships (user_id);

create function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
        nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
        'Usuario'
      ),
      80
    ),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  );

  return new;
end;
$$;

create function private.handle_new_workspace()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.memberships (workspace_id, user_id, role)
  values (new.id, new.created_by, 'owner');

  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.handle_new_workspace() from public, anon, authenticated;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function private.set_updated_at();

create trigger auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

insert into public.profiles (id, display_name, avatar_url)
select
  id,
  left(
    coalesce(
      nullif(trim(raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(email, ''), '@', 1), ''),
      'Usuario'
    ),
    80
  ),
  nullif(raw_user_meta_data ->> 'avatar_url', '')
from auth.users
on conflict (id) do nothing;

create trigger workspace_created
after insert on public.workspaces
for each row execute function private.handle_new_workspace();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.memberships enable row level security;

create policy "Users can read their profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Owners can read their workspace"
on public.workspaces
for select
to authenticated
using ((select auth.uid()) = created_by);

create policy "Users can create their workspace"
on public.workspaces
for insert
to authenticated
with check ((select auth.uid()) = created_by);

create policy "Owners can update their workspace"
on public.workspaces
for update
to authenticated
using ((select auth.uid()) = created_by)
with check ((select auth.uid()) = created_by);

create policy "Users can read their membership"
on public.memberships
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.profiles from anon, authenticated;
revoke all on public.workspaces from anon, authenticated;
revoke all on public.memberships from anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update on public.workspaces to authenticated;
grant select on public.memberships to authenticated;
