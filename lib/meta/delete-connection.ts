import "server-only";

import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Borra conexiones de Instagram y todo lo que cuelga de ellas.
 *
 * Es el único lugar que borra datos de Instagram, lo llame la persona desde Ajustes o
 * Meta desde el callback de borrado. Alcanza con borrar la conexión: la cuenta, su
 * contenido, las métricas por pieza y de cuenta, y los tokens cifrados están declarados
 * con `on delete cascade`, así que caen juntos en la misma operación y no queda nada a
 * medio borrar.
 */
export async function deleteInstagramConnections(admin: AdminClient, connectionIds: readonly string[]) {
  if (connectionIds.length === 0) return { ok: true as const, deleted: 0 };

  const { error, count } = await admin
    .from("social_connections")
    .delete({ count: "exact" })
    .in("id", [...connectionIds]);

  return error ? { ok: false as const } : { ok: true as const, deleted: count ?? 0 };
}
