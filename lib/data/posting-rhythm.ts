import "server-only";

import { RHYTHM_WEEKS } from "@/lib/production/cadence";
import { createClient } from "@/lib/supabase/server";

/**
 * Cuándo publicó de verdad, para leer su ritmo.
 *
 * Se traen sólo las fechas y sólo las de las últimas semanas que se miran: para contar
 * publicaciones no hacen falta captions, miniaturas ni métricas, y la biblioteca completa
 * son cien filas con todo eso adentro.
 *
 * Quedan fuera las Historias: se suben de a varias por día y taparían la cadencia que
 * importa, que es la de las piezas que se planifican.
 */
export async function getRecentPostingDates(workspaceId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data: connection, error: connectionError } = await supabase
    .from("social_connections")
    .select("social_accounts(id)")
    .eq("workspace_id", workspaceId)
    .eq("provider", "instagram")
    .eq("status", "connected")
    .maybeSingle();

  if (connectionError) throw new Error("No pudimos cargar la conexión de Instagram.");

  const account = readAccountId(connection?.social_accounts);
  if (account === null) return [];

  const since = new Date(Date.now() - RHYTHM_WEEKS * 7 * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("instagram_media")
    .select("posted_at")
    .eq("social_account_id", account)
    .neq("media_product_type", "STORY")
    .gte("posted_at", since);

  if (error) throw new Error("No pudimos cargar tu historial de publicaciones.");

  return (data ?? []).map((row) => row.posted_at as string);
}

/** La cuenta llega incrustada, y PostgREST la entrega como objeto o como arreglo. */
function readAccountId(value: unknown): string | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (typeof row !== "object" || row === null) return null;

  const id = (row as { id?: unknown }).id;
  return typeof id === "string" ? id : null;
}
