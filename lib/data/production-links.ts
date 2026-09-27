import "server-only";

import { buildCohort, CONTENT_KIND_PLURALS, type ContentKind } from "@/lib/content/library";
import {
  autoMatch,
  pieceMatchText,
  scorePublishCandidates,
  takenMediaIds,
} from "@/lib/production/published-link";
import { isContentFormat } from "@/lib/production/content";
import { createClient } from "@/lib/supabase/server";
import { getInstagramContentLibrary } from "./instagram-content";
import type { ContentItem } from "./production";

/** Una publicación que se le ofrece al creador para reconocer su pieza. */
export type PublishCandidate = {
  id: string;
  dateLabel: string;
  relativeDateLabel: string;
  caption: string | null;
  thumbnailUrl: string | null;
  views: number | null;
};

/**
 * Cómo rindió la pieza, una vez que se sabe cuál publicación es.
 *
 * Es a propósito poco: las métricas, la evolución y los filtros son de Contenido, y
 * repetirlas acá sería mantener dos versiones de lo mismo. Producción muestra el dato
 * que le da sentido a haber planificado la pieza y abre la puerta al resto.
 */
export type PublishedPerformance = {
  id: string;
  dateLabel: string;
  thumbnailUrl: string | null;
  formatPlural: string;
  /** Veces la mediana de visualizaciones de su formato; `null` si no hay base para comparar. */
  multiplier: number | null;
};

export type ProductionLinks = {
  /** Candidatas por pieza, sólo para las publicadas que todavía no están atadas. */
  candidates: Record<string, PublishCandidate[]>;
  /** Rendimiento por pieza, sólo para las que ya están atadas a una publicación. */
  performance: Record<string, PublishedPerformance>;
};

const EMPTY: ProductionLinks = { candidates: {}, performance: {} };

/**
 * Lo que necesita el tablero para cerrar el ciclo idea → publicado → resultado.
 *
 * Se arma en el servidor y se manda ya resuelto: el cálculo del multiplicador necesita
 * las cien piezas de la biblioteca para sacar la mediana del formato, y mandar esas cien
 * al navegador para mostrar una sola sería pagar el peso completo en cada carga.
 *
 * Cuando no hay nada publicado ni atado no se consulta Instagram: la mayoría de los
 * tableros arrancan sólo con ideas y no tienen por qué pagar tres viajes a la base.
 */
export async function getProductionLinks(
  workspaceId: string,
  items: readonly ContentItem[],
): Promise<ProductionLinks> {
  const needsCandidates = items.filter(
    (item) => item.status === "publicada" && item.linkedMediaId === null,
  );
  // Publicadas y atadas: el rendimiento es de una pieza que salió. Una que volvió a
  // producción no rindió nada todavía, aunque conserve el vínculo de una vuelta anterior.
  const linked = items.filter(
    (item) => item.linkedMediaId !== null && item.status === "publicada",
  );

  if (needsCandidates.length === 0 && linked.length === 0) return EMPTY;

  const library = await getInstagramContentLibrary(workspaceId);
  if (!library) return EMPTY;

  const candidates: Record<string, PublishCandidate[]> = {};
  for (const item of needsCandidates) {
    candidates[item.id] = scorePublishCandidates(
      library.items,
      { ...item, text: pieceMatchText(item) },
      takenMediaIds(items, item.id),
    ).map((entry) => toCandidate(entry.media));
  }

  // El cohorte se arma una vez por formato: recorrer la biblioteca entera por cada pieza
  // atada haría el mismo cálculo varias veces para llegar a la misma mediana.
  const cohorts = new Map<ContentKind, ReturnType<typeof buildCohort>>();
  const performance: Record<string, PublishedPerformance> = {};

  for (const item of linked) {
    const cohort = cohorts.get(item.format) ?? buildCohort(library.items, item.format);
    cohorts.set(item.format, cohort);

    const media = cohort.find((entry) => entry.id === item.linkedMediaId);
    // La publicación puede haber quedado fuera de las últimas cien, o el creador puede
    // haberla borrado de Instagram: se omite en vez de inventar un rendimiento vacío.
    if (!media) continue;

    performance[item.id] = {
      id: media.id,
      dateLabel: media.dateLabel,
      thumbnailUrl: media.thumbnailUrl,
      formatPlural: CONTENT_KIND_PLURALS[media.kind],
      multiplier: media.multiplier,
    };
  }

  return { candidates, performance };
}

function toCandidate(media: {
  id: string;
  dateLabel: string;
  relativeDateLabel: string;
  caption: string | null;
  thumbnailUrl: string | null;
  views: number | null;
}): PublishCandidate {
  return {
    id: media.id,
    dateLabel: media.dateLabel,
    relativeDateLabel: media.relativeDateLabel,
    caption: media.caption,
    thumbnailUrl: media.thumbnailUrl,
    views: media.views,
  };
}

/**
 * Ata la pieza a su publicación cuando no hay duda, sin preguntarle nada al creador.
 *
 * Corre al pasar la pieza a "Publicada". Nadie mueve la tarjeta el mismo día que sube el
 * video —puede subirlo el lunes y acordarse el jueves, y ese jueves haber subido otra
 * cosa—, así que la fecha no alcanza para decidir: quien decide es el texto. Si no hay
 * una coincidencia clara no ata nada y no molesta; la pieza queda publicada igual.
 *
 * Nunca hace fallar la acción que la llama: no poder adivinar cuál publicación es no es
 * un error, y que se rompa el movimiento de la tarjeta por eso sí lo sería.
 */
export async function autoLinkPublishedPiece(itemId: string): Promise<void> {
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("content_items")
    .select("id, workspace_id, title, hook, format, target_date, linked_media_id")
    .eq("id", itemId)
    .maybeSingle();

  if (!item || item.linked_media_id !== null) return;
  if (!isContentFormat(item.format)) return;

  const [library, { data: siblings }] = await Promise.all([
    getInstagramContentLibrary(item.workspace_id),
    supabase
      .from("content_items")
      .select("id, linked_media_id")
      .eq("workspace_id", item.workspace_id)
      .not("linked_media_id", "is", null),
  ]);

  if (!library) return;

  const taken = takenMediaIds(
    (siblings ?? []).map((row) => ({
      id: row.id,
      format: "reel" as const,
      targetDate: null,
      linkedMediaId: row.linked_media_id,
    })),
    item.id,
  );

  const match = autoMatch(
    scorePublishCandidates(
      library.items,
      {
        format: item.format,
        targetDate: item.target_date,
        text: pieceMatchText({ title: item.title, hook: item.hook }),
      },
      taken,
    ),
  );

  if (!match) return;

  // La fecha real es la del video, no la del momento en que se movió la tarjeta. El
  // camino manual ya lo hacía; si acá no, la pieza caía en el calendario el día del
  // arrastre, que es justo lo que `calendarDateOf` promete no hacer.
  await supabase
    .from("content_items")
    .update({ linked_media_id: match.id, published_at: match.postedAt })
    .eq("id", item.id);
}
