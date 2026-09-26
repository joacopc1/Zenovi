-- Cuándo salió realmente una pieza.
--
-- El tablero necesita separar lo que se publicó hace poco de lo que ya es historial, y
-- ninguna fecha que había servía: `target_date` es el plan, no lo que pasó, y
-- `updated_at` se mueve con cualquier edición posterior.
alter table public.content_items
  add column if not exists published_at timestamptz;

create index if not exists content_items_workspace_published_idx
  on public.content_items (workspace_id, published_at desc);

-- Las piezas que ya estaban publicadas toman la mejor fecha disponible: la de su
-- publicación real si está vinculada, si no la que se había planificado.
update public.content_items as ci
set published_at = coalesce(
  (select im.posted_at from public.instagram_media as im where im.id = ci.linked_media_id),
  ci.target_date::timestamptz,
  ci.updated_at
)
where ci.status = 'publicada'
  and ci.published_at is null;
