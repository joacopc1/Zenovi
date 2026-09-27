-- Se saca el objetivo de la pieza.
--
-- Se había agregado para que "rindió por encima de la mediana" significara algo distinto
-- según para qué se hizo la pieza. Se retira por dos razones de producto: el objetivo real
-- de un creador suele ser seguidores o ventas —que Instagram no entrega por pieza, y que
-- las ventas necesitan un CRM que todavía no existe—, y cada campo extra alarga cargar una
-- idea, que es lo que más rápido tiene que ser.
--
-- Todo vuelve a medirse por visualizaciones. La columna se borra en vez de quedar sin uso:
-- una columna que nadie lee es una pregunta abierta para quien lea el esquema mañana.
alter table public.content_items
  drop constraint if exists content_items_objective_check;

alter table public.content_items
  drop column if exists objective;
