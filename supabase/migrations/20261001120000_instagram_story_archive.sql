-- Meta deja de entregar una Historia a las 24 h y la URL de su CDN caduca a los días.
-- Se guarda una copia propia al sincronizar para que la miniatura y el análisis sigan
-- funcionando después.
alter table public.instagram_media
add column archived_media_path text,
add column archived_thumbnail_path text;

-- Privado y sin políticas en storage.objects: sólo el servidor (service_role) lee y
-- escribe. El navegador recibe URLs firmadas de vida corta.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'instagram-story-archive',
  'instagram-story-archive',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
)
on conflict (id) do nothing;
