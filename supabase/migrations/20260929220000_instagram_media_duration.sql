-- Meta no expone la duración como insight. La guardamos después de leer una vez los
-- metadatos del archivo autorizado para que la biblioteca no dependa de una URL temporal.
alter table public.instagram_media
  add column duration_ms integer;

alter table public.instagram_media
  add constraint instagram_media_duration_ms_check
  check (duration_ms is null or duration_ms between 1 and 21600000);

comment on column public.instagram_media.duration_ms is
  'Duración verificada desde los metadatos del archivo de video, en milisegundos.';
