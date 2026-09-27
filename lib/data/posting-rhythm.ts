import "server-only";

import { RHYTHM_WEEKS } from "@/lib/production/cadence";
import { isContentKind } from "@/lib/content/library";
import type { PublishedPiece } from "@/lib/production/reconcile";
import { createClient } from "@/lib/supabase/server";

/**
 * Lo que realmente publicó en las últimas semanas.
 *
 * Sirve para dos cosas a la vez, por eso una sola consulta: leer el ritmo de publicación
 * y descubrir lo que salió sin pasar por el tablero. Se traen sólo las últimas semanas
 * —no la biblioteca entera— porque más atrás no cambia ninguna de las dos respuestas.
 *
 * Quedan fuera las Historias: se suben de a varias por día y taparían la cadencia que
 * importa, que es la de las piezas que se planifican.
 */
export async function getRecentPublications(workspaceId: string): Promise<PublishedPiece[]> {
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
    .select("id, posted_at, caption, thumbnail_url, media_url, media_type, media_product_type")
    .eq("social_account_id", account)
    // `neq` sola descarta también las filas con el tipo en NULL —en SQL, NULL <> 'STORY'
    // no es verdadero—, y el sync guarda NULL cuando Instagram no lo manda. Contenido las
    // trata como publicaciones, así que acá tienen que contar igual.
    .or("media_product_type.is.null,media_product_type.neq.STORY")
    .gte("posted_at", since)
    .order("posted_at", { ascending: false });

  if (error) throw new Error("No pudimos cargar tu historial de publicaciones.");

  return (data ?? []).map(toPublishedPiece);
}

function toPublishedPiece(row: {
  id: string;
  posted_at: string;
  caption: string | null;
  thumbnail_url: string | null;
  media_url: string | null;
  media_type: string;
  media_product_type: string | null;
}): PublishedPiece {
  const kind = row.media_product_type?.toUpperCase() === "REELS" ? "reel" : "publication";

  return {
    id: row.id,
    postedAt: row.posted_at,
    caption: row.caption,
    // Los videos no traen `media_url` servible como imagen; sin miniatura se muestra el hueco.
    thumbnailUrl: row.thumbnail_url ?? (row.media_type === "VIDEO" ? null : row.media_url),
    kind: isContentKind(kind) ? kind : "publication",
  };
}

/** La cuenta llega incrustada, y PostgREST la entrega como objeto o como arreglo. */
function readAccountId(value: unknown): string | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (typeof row !== "object" || row === null) return null;

  const id = (row as { id?: unknown }).id;
  return typeof id === "string" ? id : null;
}
