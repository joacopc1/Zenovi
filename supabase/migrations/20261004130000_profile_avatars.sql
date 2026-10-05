-- Las fotos de perfil que sube cada persona desde Ajustes. Público para poder mostrarlas
-- sin firmar cada vez, con un nombre al azar por archivo; sin políticas en
-- storage.objects: sólo el servidor escribe, siempre en la carpeta de quien pide.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;
