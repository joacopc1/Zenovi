export type ContentKind = "reel" | "story" | "publication";
export type ContentSort =
  | "recent"
  | "views"
  | "reach"
  | "interactions"
  | "likes"
  | "comments"
  | "saves"
  | "shares"
  | "multiplier";
export type ContentSortDirection = "desc" | "asc";

export type ContentLibraryItem = {
  id: string;
  kind: ContentKind;
  formatLabel: string;
  caption: string | null;
  thumbnailUrl: string | null;
  mediaUrl: string | null;
  permalink: string | null;
  postedAt: string;
  dateLabel: string;
  relativeDateLabel: string;
  likes: number | null;
  comments: number | null;
  views: number | null;
  reach: number | null;
  interactions: number | null;
  saves: number | null;
  shares: number | null;
  averageWatchTimeMs: number | null;
  totalWatchTimeMs: number | null;
  skipRate: number | null;
};

/**
 * Una pieza situada contra el rendimiento habitual de su propio formato.
 * `multiplier` es `null` cuando no hay base suficiente para afirmar nada.
 */
export type RankedContentItem = ContentLibraryItem & { multiplier: number | null };

/** Debajo de este tamaño la mediana es ruido, no un histórico. */
const MIN_COHORT_FOR_MULTIPLIER = 3;

/**
 * Reúne las piezas de un formato y sitúa cada una contra la mediana de ese grupo.
 *
 * Seleccionar y medir van juntos a propósito: el multiplicador sólo significa algo
 * dentro de un mismo formato — comparar un Reel contra Historias no dice nada — y
 * se calcula sobre el cohorte completo, antes de cualquier búsqueda, porque buscar
 * filtra lo que se ve y no cambia lo que una pieza rindió.
 */
export function buildCohort(
  items: ContentLibraryItem[],
  kind: ContentKind,
): RankedContentItem[] {
  const cohort = items.filter((item) => item.kind === kind);
  const reference = medianViews(cohort);

  return cohort.map((item) => ({
    ...item,
    multiplier: reference === null || item.views === null ? null : item.views / reference,
  }));
}

/**
 * Puesto de una pieza dentro de su cohorte por visualizaciones.
 * Sólo compite contra piezas que tienen el dato: rankear contra ausencias
 * inflaría artificialmente la posición.
 */
export function viewsRank(cohort: RankedContentItem[], id: string) {
  const measurable = cohort.filter((item) => item.views !== null);
  const position = sortContentItems(measurable, "views").findIndex((item) => item.id === id);

  return position === -1 ? null : { position: position + 1, total: measurable.length };
}

export function searchContentItems<T extends ContentLibraryItem>(items: T[], query: string) {
  const normalized = query.trim().toLocaleLowerCase("es");
  if (normalized.length === 0) return items;

  return items.filter(
    (item) =>
      item.caption?.toLocaleLowerCase("es").includes(normalized) ||
      item.formatLabel.toLocaleLowerCase("es").includes(normalized),
  );
}

export function sortContentItems(
  items: RankedContentItem[],
  sort: ContentSort,
  direction: ContentSortDirection = "desc",
) {
  return [...items].sort((left, right) => {
    if (sort === "recent") {
      const delta = new Date(right.postedAt).getTime() - new Date(left.postedAt).getTime();
      return direction === "desc" ? delta : -delta;
    }

    return compareMetric(left[sort], right[sort], direction);
  });
}

function compareMetric(
  left: number | null,
  right: number | null,
  direction: ContentSortDirection,
) {
  // Una pieza sin el dato disponible nunca encabeza la lista: falta el dato, no vale cero.
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return direction === "desc" ? right - left : left - right;
}

function medianViews(items: ContentLibraryItem[]) {
  const values = items
    .map((item) => item.views)
    .filter((value): value is number => value !== null)
    .sort((left, right) => left - right);

  if (values.length < MIN_COHORT_FOR_MULTIPLIER) return null;

  const middle = Math.floor(values.length / 2);
  const median =
    values.length % 2 === 0 ? (values[middle - 1] + values[middle]) / 2 : values[middle];

  return median > 0 ? median : null;
}
