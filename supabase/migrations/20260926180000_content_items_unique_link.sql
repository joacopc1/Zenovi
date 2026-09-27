-- Una publicación pertenece a una sola pieza.
--
-- La aplicación ya descarta las publicaciones que otra pieza reclamó, pero eso se decide
-- leyendo antes de escribir: dos pestañas abiertas pueden enlazar el mismo Reel a dos
-- piezas distintas, y entonces las dos muestran el mismo rendimiento como si fuera propio.
-- El índice lo vuelve imposible en vez de improbable.
--
-- Es parcial porque `linked_media_id` es NULL en toda pieza que todavía no se publicó, y
-- un índice único común dejaría pasar un solo NULL en Postgres... o los dejaría pasar
-- todos según la versión; el `where` evita depender de eso.
create unique index if not exists content_items_linked_media_unique
  on public.content_items (linked_media_id)
  where linked_media_id is not null;
