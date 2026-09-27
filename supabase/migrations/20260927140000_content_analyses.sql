-- El análisis de una pieza, guardado.
--
-- Se pide a demanda y consume créditos, así que lo que importa es no repetirlo: abrir un
-- análisis ya hecho no puede volver a procesar el video. Por eso hay una sola fila por
-- pieza y el resultado se guarda entero.
--
-- `status` es el estado del trabajo y no del contenido: una pieza puede estar en cola,
-- corriendo, lista o fallada, y la pantalla dibuja cada caso distinto.
--
-- `result` guarda el análisis completo como JSON en vez de una columna por sección. La
-- forma de lo que devuelve el pipeline va a cambiar —por eso existe `pipeline_version`— y
-- migrar veinte columnas cada vez que cambie sería peor que versionar el documento.
create table if not exists public.content_analyses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  instagram_media_id uuid not null references public.instagram_media (id) on delete cascade,
  status text not null default 'queued',
  -- La versión del pipeline que lo produjo: un análisis viejo se puede reconocer y rehacer.
  pipeline_version text,
  result jsonb,
  -- Por qué falló, en el idioma del creador. Null mientras no haya fallado.
  failure_reason text,
  -- Si se le puede volver a pedir. Un fallo por falta de crédito no se reintenta solo.
  can_retry boolean not null default true,
  -- Lo que costó, para poder medir el gasto real contra la tabla de créditos.
  credits_spent integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_analyses_status_check check (
    status in ('queued', 'running', 'ready', 'failed')
  ),
  -- Un análisis listo sin resultado, o un fallo sin motivo, serían filas que mienten.
  constraint content_analyses_ready_has_result check (status <> 'ready' or result is not null),
  constraint content_analyses_failed_has_reason check (
    status <> 'failed' or failure_reason is not null
  )
);

-- Una pieza, un análisis: pedirlo dos veces no puede crear dos trabajos ni cobrar dos veces.
create unique index if not exists content_analyses_media_unique
  on public.content_analyses (instagram_media_id);

create index if not exists content_analyses_pending_idx
  on public.content_analyses (status, created_at)
  where status in ('queued', 'running');

create trigger content_analyses_set_updated_at
before update on public.content_analyses
for each row execute function private.set_updated_at();

alter table public.content_analyses enable row level security;

create policy "Members can read workspace content analyses"
on public.content_analyses
for select
to authenticated
using (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = content_analyses.workspace_id
      and memberships.user_id = (select auth.uid())
  )
);

create policy "Members can request workspace content analyses"
on public.content_analyses
for insert
to authenticated
with check (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = content_analyses.workspace_id
      and memberships.user_id = (select auth.uid())
  )
);

-- Borrar sí, para poder volver a pedirlo. Actualizar no: el resultado lo escribe el
-- trabajo en segundo plano con la clave de servicio, nunca el navegador.
create policy "Members can discard workspace content analyses"
on public.content_analyses
for delete
to authenticated
using (
  exists (
    select 1
    from public.memberships
    where memberships.workspace_id = content_analyses.workspace_id
      and memberships.user_id = (select auth.uid())
  )
);
