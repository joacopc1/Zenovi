-- Instagram asigna dos identificadores a una misma cuenta:
-- - `id` de /me: el de la cuenta dentro de la app, que ya guardamos en `provider_account_id`;
-- - `user_id` de /me: el de la cuenta profesional de Instagram.
-- Meta avisa las desautorizaciones y los pedidos de borrado con el segundo, así que sin
-- guardarlo el callback de borrado llega, verifica la firma y no encuentra la cuenta.
alter table public.social_accounts
  add column professional_account_id text;

create unique index social_accounts_professional_account_key
  on public.social_accounts (provider, professional_account_id)
  where professional_account_id is not null;
