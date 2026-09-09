alter table private.oauth_attempts set schema public;
alter table public.oauth_attempts rename to instagram_oauth_attempts;

alter table private.social_connection_credentials set schema public;
alter table public.social_connection_credentials rename to instagram_connection_credentials;

alter table public.instagram_oauth_attempts enable row level security;
alter table public.instagram_connection_credentials enable row level security;

revoke all on public.instagram_oauth_attempts from public, anon, authenticated;
revoke all on public.instagram_connection_credentials from public, anon, authenticated;

grant select, insert, update, delete on public.instagram_oauth_attempts to service_role;
grant select, insert, update, delete on public.instagram_connection_credentials to service_role;
grant select, insert, update, delete on public.social_connections to service_role;
grant select, insert, update, delete on public.social_accounts to service_role;
