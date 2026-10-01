-- Vercel Hobby sólo permite un cron diario, y ese sigue en vercel.json con la
-- sincronización completa. Supabase Cron agrega únicamente el refresco horario de las
-- Historias vivas; si este job falla, el resto de la app no se entera. Al pasar a Vercel
-- Pro, este job se mueve a vercel.json y se borra acá; la ruta no cambia.
--
-- Antes de aplicar, guardar en Vault (una sola vez, desde el SQL editor):
--   select vault.create_secret('https://<dominio-de-produccion>', 'zenovi_app_url');
--   select vault.create_secret('<mismo valor que CRON_SECRET en Vercel>', 'zenovi_cron_secret');
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create or replace function private.call_cron_route(route text)
returns bigint
language sql
security definer
set search_path = ''
as $$
  select net.http_get(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'zenovi_app_url') || route,
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'zenovi_cron_secret')
    ),
    -- pg_net corta a los 5 s por defecto; refrescar varias cuentas puede tardar más.
    timeout_milliseconds := 300000
  );
$$;

revoke all on function private.call_cron_route(text) from public, anon, authenticated;

-- Cada hora: las Historias vivas, para que su última lectura quede cerca del vencimiento.
select cron.schedule('instagram-stories-hourly', '0 * * * *', $$select private.call_cron_route('/api/cron/instagram-stories')$$);
