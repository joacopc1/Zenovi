-- Para qué se hizo la pieza.
--
-- Sin esto, "rindió por encima de la mediana" siempre significa lo mismo: tuvo más
-- visualizaciones. Pero una pieza hecha para que la guarden, con muchas vistas y ningún
-- guardado, no funcionó, y Zenovi la estaba felicitando igual. El objetivo decide contra
-- qué métrica se juzga.
--
-- Queda NULL en todo lo que ya existe: no se puede adivinar para qué se hizo algo que se
-- planificó antes de que existiera el campo, y suponerlo sería inventar el veredicto.
alter table public.content_items
  add column if not exists objective text;

alter table public.content_items
  drop constraint if exists content_items_objective_check;

alter table public.content_items
  add constraint content_items_objective_check check (
    objective is null
    or objective in ('vistas', 'interaccion', 'guardado', 'compartido')
  );
