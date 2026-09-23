-- El vínculo con la pieza publicada pasa a ser una clave foránea de verdad.
-- Era un uuid suelto: la base no sabía a qué apuntaba, aceptaba ids inexistentes y, al
-- borrar una cuenta de Instagram —que borra su contenido—, la idea quedaba apuntando a
-- una pieza que ya no existe. Con la clave foránea, la base vacía el vínculo sola.
update public.content_items
set linked_media_id = null
where linked_media_id is not null
  and not exists (
    select 1 from public.instagram_media where instagram_media.id = content_items.linked_media_id
  );

alter table public.content_items
  add constraint content_items_linked_media_fkey
  foreign key (linked_media_id) references public.instagram_media (id) on delete set null;

create index content_items_linked_media_idx
on public.content_items (linked_media_id)
where linked_media_id is not null;

-- El formato usa el mismo vocabulario que la biblioteca de contenido, que dice
-- "publication" donde producción decía "post". Eran la misma cosa con dos nombres, y
-- cruzar una idea con su pieza publicada habría necesitado una traducción en el medio.
alter table public.content_items drop constraint content_items_format_check;

update public.content_items set format = 'publication' where format = 'post';

alter table public.content_items
  add constraint content_items_format_check
  check (format in ('reel', 'story', 'publication'));
