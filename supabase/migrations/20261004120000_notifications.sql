-- Las notificaciones del header. Sin user_id es una novedad para todos (un update, una
-- noticia de Zenovi); con user_id es sólo de esa persona (un análisis listo, una
-- sincronización que falló). Las escribe sólo el servidor: nadie publica desde el navegador.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  kind text not null check (kind in ('update', 'news', 'sync', 'analysis', 'credits')),
  title text not null check (char_length(title) between 1 and 120),
  body text check (char_length(body) <= 280),
  -- Sólo rutas propias de la app: una notificación nunca lleva a otro sitio.
  href text check (href ~ '^/[A-Za-z0-9/_?=&%.-]*$'),
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "People read their own notifications and the ones for everyone"
on public.notifications
for select
to authenticated
using (user_id is null or user_id = (select auth.uid()));

revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant select, insert, update, delete on public.notifications to service_role;

-- Qué leyó cada persona. Una fila por notificación leída.
create table if not exists public.notification_reads (
  user_id uuid not null references auth.users (id) on delete cascade,
  notification_id uuid not null references public.notifications (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, notification_id)
);

alter table public.notification_reads enable row level security;

create policy "People read their own read marks"
on public.notification_reads
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "People mark as read what they can see"
on public.notification_reads
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.notifications
    where notifications.id = notification_reads.notification_id
      and (notifications.user_id is null or notifications.user_id = (select auth.uid()))
  )
);

revoke all on public.notification_reads from anon, authenticated;
grant select, insert on public.notification_reads to authenticated;
grant select, insert, update, delete on public.notification_reads to service_role;
