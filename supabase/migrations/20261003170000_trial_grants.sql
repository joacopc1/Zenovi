-- La prueba gratis también se da una sola vez por mail, no sólo por Instagram: sin esto,
-- una persona con alias de Gmail (juan+1@, j.uan@) o con varios workspaces conectaba un
-- Instagram distinto en cada uno y sumaba créditos. Como con Instagram, se guarda una
-- huella (HMAC) del mail normalizado, no el mail, y no se borra al irse.
create table if not exists public.email_trial_claims (
  email_fingerprint text primary key check (char_length(email_fingerprint) = 64),
  first_workspace_id uuid references public.workspaces (id) on delete set null,
  claimed_at timestamptz not null default now()
);

alter table public.email_trial_claims enable row level security;
revoke all on public.email_trial_claims from anon, authenticated;
grant select, insert, update, delete on public.email_trial_claims to service_role;

-- La decisión ya tomada para cada workspace y el Instagram que tiene conectado: así el
-- saldo, que se pide en cada página, lee una fila en vez de recalcular las dos huellas.
create table if not exists public.workspace_trial_grants (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  account_fingerprint text not null check (char_length(account_fingerprint) = 64),
  granted boolean not null,
  reason text check (reason in ('trial_used', 'email_used')),
  decided_at timestamptz not null default now()
);

alter table public.workspace_trial_grants enable row level security;
revoke all on public.workspace_trial_grants from anon, authenticated;
grant select, insert, update, delete on public.workspace_trial_grants to service_role;
