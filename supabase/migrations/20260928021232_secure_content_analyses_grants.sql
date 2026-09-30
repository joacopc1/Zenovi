-- La tabla nació antes del cambio de Supabase que deja de heredar privilegios amplios.
-- RLS ya bloqueaba filas ajenas, pero los grants deben expresar el contrato real:
-- miembros piden/leen/descartan; sólo el servidor actualiza el resultado del trabajo.
revoke all on public.content_analyses from anon, authenticated;

grant select, insert, delete on public.content_analyses to authenticated;
grant select, insert, update, delete on public.content_analyses to service_role;
