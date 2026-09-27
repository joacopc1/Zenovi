/**
 * Qué se ve en Producción, decidido en un solo lugar.
 *
 * Antes esto vivía desparramado en el cuerpo del componente: siete derivaciones encadenadas
 * —separar publicadas, cortar por dos semanas, filtrar por tipo, juntar los ids reclamados,
 * leer la cadencia, listar los tipos, validar el filtro activo— donde cada una dependía del
 * orden de la anterior y ninguna se podía probar sin montar React.
 *
 * Acá entra lo que hay y sale lo que se muestra. El componente pasa a hacer lo único que
 * le corresponde, que es dibujar.
 */
import {
  collectContentTypes,
  contentTypeSuggestions,
  matchesContentType,
  matchesSearch,
  splitRecentlyPublished,
  type ContentStatus,
} from "./content.ts";
import { readCadence, type CadenceReading } from "./cadence.ts";
import { unregisteredPublications, type PublishedPiece } from "./reconcile.ts";
import type { ContentKind } from "../content/library.ts";

/** Lo que el tablero necesita saber de cada pieza para decidir dónde va. */
type BoardItem = {
  id: string;
  title: string;
  contentType: string;
  format: ContentKind;
  status: ContentStatus;
  targetDate: string | null;
  publishedAt: string | null;
  linkedMediaId: string | null;
  hook: string;
  development: string;
  cta: string;
  referenceUrl: string;
};

export type ProductionBoard<T extends BoardItem> = {
  /** El kanban: lo que está en curso más lo que salió hace poco, pasado por el filtro. */
  columns: T[];
  /** Lo que salió hace más de dos semanas. No se filtra: es el registro, no la vista de trabajo. */
  history: T[];
  /** Todas las piezas que pasan el filtro, para el calendario. */
  visible: T[];
  /** Publicaciones que ninguna pieza reclama, filtro o no filtro. */
  unregistered: PublishedPiece[];
  /** Publicaciones que sí reclama alguna pieza, aunque el filtro la esconda. */
  claimedMedia: Set<string>;
  cadence: CadenceReading;
  /** Los tipos propios del creador; vacío si todavía no escribió ninguno. */
  ownTypes: string[];
  /** Lo que se ofrece al escribir un tipo: los propios, o los de arranque. */
  typeSuggestions: readonly string[];
  /** Lo que coincide con lo buscado, para saltar ahí sin buscarlo con la vista. Vacío si no se buscó. */
  matches: T[];
  /** Si hay algo escrito en la búsqueda, aunque no haya coincidencias. */
  searching: boolean;
  /**
   * El filtro que efectivamente rige. Es `null` cuando el tipo pedido ya no existe —se
   * borró la última pieza que lo usaba—, porque si no el tablero queda vacío sin ningún
   * control a la vista para volver atrás.
   */
  activeType: string | null;
};

/** Cuántos resultados se ofrecen: una lista larga deja de ser un atajo. */
const MAX_MATCHES = 6;

export function buildProductionBoard<T extends BoardItem>({
  items,
  published,
  requestedType,
  query = "",
  now = new Date(),
}: {
  items: readonly T[];
  published: readonly PublishedPiece[];
  requestedType: string | null;
  /** Lo que se escribió en la búsqueda; vacío es "todo". */
  query?: string;
  now?: Date;
}): ProductionBoard<T> {
  const ownTypes = collectContentTypes(items).map((entry) => entry.value);
  const activeType =
    requestedType !== null && ownTypes.some((own) => matchesContentType({ contentType: own }, requestedType))
      ? requestedType
      : null;

  // Buscar hace las dos cosas: achica el tablero a lo que coincide y además ofrece la
  // lista para saltar directo a una pieza sin tener que encontrarla con la vista.
  const visible = items.filter(
    (item) =>
      (activeType === null || matchesContentType(item, activeType)) && matchesSearch(item, query),
  );
  const matches =
    query.trim().length === 0
      ? []
      : items.filter((item) => matchesSearch(item, query)).slice(0, MAX_MATCHES);

  const { recent, older } = splitRecentlyPublished(
    items.filter((item) => item.status === "publicada"),
    now,
  );
  const recentIds = new Set(recent.map((item) => item.id));

  return {
    columns: visible.filter((item) => item.status !== "publicada" || recentIds.has(item.id)),
    history: older,
    visible,
    unregistered: unregisteredPublications(published, items),
    claimedMedia: new Set(
      items.map((item) => item.linkedMediaId).filter((id): id is string => id !== null),
    ),
    // La cadencia y el historial se leen sobre la cuenta entera: el ritmo de publicación
    // no cambia porque se esté mirando una categoría.
    cadence: readCadence(
      items.map((item) => ({ ...item, status: item.status as string })),
      published.map((piece) => piece.postedAt),
      now,
    ),
    ownTypes,
    typeSuggestions: contentTypeSuggestions(ownTypes),
    matches,
    searching: query.trim().length > 0,
    activeType,
  };
}
