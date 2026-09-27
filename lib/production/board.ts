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
  /**
   * El filtro que efectivamente rige. Es `null` cuando el tipo pedido ya no existe —se
   * borró la última pieza que lo usaba—, porque si no el tablero queda vacío sin ningún
   * control a la vista para volver atrás.
   */
  activeType: string | null;
};

export function buildProductionBoard<T extends BoardItem>({
  items,
  published,
  requestedType,
  now = new Date(),
}: {
  items: readonly T[];
  published: readonly PublishedPiece[];
  requestedType: string | null;
  now?: Date;
}): ProductionBoard<T> {
  const ownTypes = collectContentTypes(items).map((entry) => entry.value);
  const activeType =
    requestedType !== null && ownTypes.some((own) => matchesContentType({ contentType: own }, requestedType))
      ? requestedType
      : null;

  const visible =
    activeType === null ? [...items] : items.filter((item) => matchesContentType(item, activeType));

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
    activeType,
  };
}
