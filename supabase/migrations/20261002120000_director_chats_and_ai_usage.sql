-- Las conversaciones con el Director y lo que cuesta usar la IA.
--
-- Los chats son de cada persona: dentro de un workspace, nadie lee las conversaciones de
-- otro miembro. Los mensajes y el consumo los escribe sólo el servidor, después de hablar
-- con el modelo: el navegador no puede inventar una respuesta del Director ni descontarse
-- créditos a mano.

create table public.director_chats (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Null hasta que el primer intercambio le da un título.
  title text check (title is null or char_length(title) between 1 and 120),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index director_chats_owner_recent_idx
  on public.director_chats (user_id, workspace_id, updated_at desc);

create trigger director_chats_set_updated_at
before update on public.director_chats
for each row execute function private.set_updated_at();

alter table public.director_chats enable row level security;

create policy "Owners manage their Director chats"
on public.director_chats
for all
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.memberships
    where memberships.workspace_id = director_chats.workspace_id
      and memberships.user_id = (select auth.uid())
  )
)
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.memberships
    where memberships.workspace_id = director_chats.workspace_id
      and memberships.user_id = (select auth.uid())
  )
);

revoke all on public.director_chats from anon, authenticated;
grant select, insert, update, delete on public.director_chats to authenticated;
grant select, insert, update, delete on public.director_chats to service_role;

-- Un mensaje guarda sus partes tal como las usa la interfaz (texto, y más adelante
-- herramientas y citas), así una conversación se reabre idéntica.
create table public.director_messages (
  id text primary key,
  chat_id uuid not null references public.director_chats (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  parts jsonb not null,
  created_at timestamptz not null default now()
);

create index director_messages_chat_idx on public.director_messages (chat_id, created_at);

alter table public.director_messages enable row level security;

create policy "Owners read their Director messages"
on public.director_messages
for select
to authenticated
using (
  exists (
    select 1 from public.director_chats
    where director_chats.id = director_messages.chat_id
      and director_chats.user_id = (select auth.uid())
  )
);

revoke all on public.director_messages from anon, authenticated;
grant select on public.director_messages to authenticated;
grant select, insert, update, delete on public.director_messages to service_role;

-- Cada operación con IA deja su costo real. De acá salen el círculo de uso del
-- encabezado y, cuando existan los planes, la tabla de créditos medida y no estimada.
create table public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  feature text not null check (
    feature in ('director_chat', 'director_title', 'reel_analysis', 'story_analysis', 'reel_script')
  ),
  model text not null,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  cached_input_tokens integer not null default 0 check (cached_input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  cost_usd numeric(12, 6) not null check (cost_usd >= 0),
  credits numeric(12, 2) not null check (credits >= 0),
  -- El chat, el análisis o la pieza que lo originó.
  reference_id uuid,
  created_at timestamptz not null default now()
);

create index ai_usage_events_workspace_period_idx
  on public.ai_usage_events (workspace_id, created_at desc);

alter table public.ai_usage_events enable row level security;

create policy "Members read workspace AI usage"
on public.ai_usage_events
for select
to authenticated
using (
  exists (
    select 1 from public.memberships
    where memberships.workspace_id = ai_usage_events.workspace_id
      and memberships.user_id = (select auth.uid())
  )
);

revoke all on public.ai_usage_events from anon, authenticated;
grant select on public.ai_usage_events to authenticated;
grant select, insert on public.ai_usage_events to service_role;
