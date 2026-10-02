-- La prueba gratis se da una vez por cuenta de Instagram, no por cuenta de Zenovi: sin esto,
-- alguien desconecta su Instagram al terminar la prueba, crea otra cuenta y lo vuelve a
-- conectar. Se guarda una huella (HMAC) del id de Instagram, no el id: alcanza para saber
-- si ya tuvo prueba y no sirve para identificar a nadie. No se borra al desconectar.
create table if not exists public.instagram_trial_claims (
  account_fingerprint text primary key check (char_length(account_fingerprint) = 64),
  first_workspace_id uuid references public.workspaces (id) on delete set null,
  claimed_at timestamptz not null default now()
);

alter table public.instagram_trial_claims enable row level security;
revoke all on public.instagram_trial_claims from anon, authenticated;
grant select, insert, update, delete on public.instagram_trial_claims to service_role;
