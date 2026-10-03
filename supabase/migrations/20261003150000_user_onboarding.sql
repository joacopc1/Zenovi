-- Lo que cuenta cada persona al empezar (a qué se dedica, cómo conoció Zenovi) y si cerró
-- la lista de primeros pasos del Inicio. Es por persona, no por workspace: cada quien ve y
-- responde lo suyo.
create table if not exists public.user_onboarding (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text check (role is null or char_length(role) <= 40),
  source text check (source is null or char_length(source) <= 40),
  answered_at timestamptz,
  checklist_dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_onboarding_set_updated_at
before update on public.user_onboarding
for each row execute function private.set_updated_at();

alter table public.user_onboarding enable row level security;

create policy "People manage their own onboarding"
on public.user_onboarding
for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

revoke all on public.user_onboarding from anon, authenticated;
grant select, insert, update on public.user_onboarding to authenticated;
grant select, insert, update, delete on public.user_onboarding to service_role;
