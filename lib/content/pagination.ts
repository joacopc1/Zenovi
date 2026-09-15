import type { ContentKind, ContentSort, ContentSortDirection } from "./library";

/** Entra justo en las grillas de 4, 3 y 2 columnas: nunca queda una fila a medias. */
export const CONTENT_PAGE_SIZE = 24;

export function paginate<T>(items: readonly T[], requestedPage: number, pageSize = CONTENT_PAGE_SIZE) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // Una página fuera de rango (enlace viejo, filtro que dejó menos resultados) cae en la válida más cercana.
  const page = Math.min(Math.max(Number.isInteger(requestedPage) ? requestedPage : 1, 1), totalPages);
  const start = (page - 1) * pageSize;

  return {
    pageItems: items.slice(start, start + pageSize),
    page,
    totalPages,
    total,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, total),
  };
}

export type ContentUrlState = {
  kind: ContentKind;
  sort: ContentSort;
  direction: ContentSortDirection;
  search: string;
  page?: number;
};

/** URL de la biblioteca con sólo los parámetros que difieren de los valores por defecto. */
export function buildContentUrl({ kind, sort, direction, search, page = 1 }: ContentUrlState) {
  const params = new URLSearchParams();
  if (kind !== "reel") params.set("type", kind);
  if (sort !== "recent") params.set("sort", sort);
  if (direction !== "desc") params.set("dir", direction);

  const trimmed = search.trim();
  if (trimmed) params.set("q", trimmed);
  if (page > 1) params.set("page", String(page));

  const suffix = params.toString();
  return suffix ? `/content?${suffix}` : "/content";
}
