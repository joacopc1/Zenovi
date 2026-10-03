-- La lectura del día del Inicio, escrita por la IA una vez por día y por workspace. Se
-- guarda para no pagarla en cada visita: el resto del día se muestra la misma.
create table if not exists public.home_insights (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  day date not null,
  text text not null check (char_length(text) between 1 and 400),
  model text not null,
  created_at timestamptz not null default now(),
  primary key (workspace_id, day)
);

alter table public.home_insights enable row level security;

create policy "Members read workspace home insights"
on public.home_insights
for select
to authenticated
using (
  exists (
    select 1 from public.memberships
    where memberships.workspace_id = home_insights.workspace_id
      and memberships.user_id = (select auth.uid())
  )
);

revoke all on public.home_insights from anon, authenticated;
grant select on public.home_insights to authenticated;
grant select, insert, update, delete on public.home_insights to service_role;

-- El consumo de la lectura del día se registra como cualquier otro uso de IA.
alter table public.ai_usage_events drop constraint if exists ai_usage_events_feature_check;
alter table public.ai_usage_events add constraint ai_usage_events_feature_check check (
  feature in ('director_chat', 'director_title', 'reel_analysis', 'story_analysis', 'reel_script', 'home_insight')
);
