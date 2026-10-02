-- Lo que el creador adjunta en el Director (capturas, fotos, PDFs). Privado y sin
-- políticas en storage.objects: sólo el servidor lee y escribe, y siempre dentro de la
-- carpeta de quien pide (<workspace>/<persona>/<archivo>).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'director-attachments',
  'director-attachments',
  false,
  4194304,
  array['image/webp', 'application/pdf']
)
on conflict (id) do nothing;
