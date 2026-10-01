-- Si una respuesta del Director le sirvió o no a quien la pidió.
--
-- No reentrena ningún modelo: sirve para que el equipo vea qué respuestas fallan y ajuste
-- la capacitación y las guías con eso. Una calificación por persona y por respuesta; cambiar
-- de opinión reemplaza la anterior.
create table public.director_message_feedback (
  message_id text not null references public.director_messages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating text not null check (rating in ('up', 'down')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create trigger director_message_feedback_set_updated_at
before update on public.director_message_feedback
for each row execute function private.set_updated_at();

alter table public.director_message_feedback enable row level security;

-- Sólo se califica una respuesta de un chat propio.
create policy "Owners rate answers in their Director chats"
on public.director_message_feedback
for all
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.director_messages
    join public.director_chats on director_chats.id = director_messages.chat_id
    where director_messages.id = director_message_feedback.message_id
      and director_chats.user_id = (select auth.uid())
  )
)
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.director_messages
    join public.director_chats on director_chats.id = director_messages.chat_id
    where director_messages.id = director_message_feedback.message_id
      and director_messages.role = 'assistant'
      and director_chats.user_id = (select auth.uid())
  )
);

revoke all on public.director_message_feedback from anon, authenticated;
grant select, insert, update, delete on public.director_message_feedback to authenticated;
grant select on public.director_message_feedback to service_role;
