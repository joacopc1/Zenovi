-- Lo que las personas cuentan desde el botón "Feedback" del header. Cada una escribe sólo
-- a su nombre y no puede leer lo de nadie (ni lo propio): lo lee el equipo desde el servidor.
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  message text not null check (char_length(message) between 1 and 2000),
  -- La pantalla desde donde se mandó, para entender de qué habla.
  page text check (char_length(page) <= 200),
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;

create policy "People send feedback in their own name"
on public.feedback
for insert
to authenticated
with check (user_id = (select auth.uid()));

revoke all on public.feedback from anon, authenticated;
grant insert on public.feedback to authenticated;
grant select, insert, update, delete on public.feedback to service_role;
