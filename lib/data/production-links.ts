import "server-only";

import {
  buildCohort,
  viewsRank,
  CONTENT_KIND_PLURALS,
  type ContentKind,
} from "@/lib/content/library";
import { rankPublishCandidates, takenMediaIds } from "@/lib/production/published-link";
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

/** Cómo rindió la pieza, una vez que se sabe cuál publicación es. */
export type PublishedPerformance = {
  id: string;
  dateLabel: string;
  thumbnailUrl: string | null;
  permalink: string | null;
  formatPlural: string;
  views: number | null;
  reach: number | null;
  interactions: number | null;
  saves: number | null;
  shares: number | null;
  /** Veces la mediana de su formato; `null` cuando no hay base para comparar. */
  multiplier: number | null;
  rank: { position: number; total: number } | null;
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
  const linked = items.filter((item) => item.linkedMediaId !== null);

  if (needsCandidates.length === 0 && linked.length === 0) return EMPTY;

  const library = await getInstagramContentLibrary(workspaceId);
  if (!library) return EMPTY;

  const candidates: Record<string, PublishCandidate[]> = {};
  for (const item of needsCandidates) {
    candidates[item.id] = rankPublishCandidates(
      library.items,
      item,
      takenMediaIds(items, item.id),
    ).map(toCandidate);
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
      permalink: media.permalink,
      formatPlural: CONTENT_KIND_PLURALS[media.kind],
      views: media.views,
      reach: media.reach,
      interactions: media.interactions,
      saves: media.saves,
      shares: media.shares,
      multiplier: media.multiplier,
      rank: viewsRank(cohort, media.id),
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
