/**
 * Lo que salió en Instagram pero el tablero no sabe.
 *
 * Pasa todo el tiempo y de dos maneras. Una: el creador tenía la idea anotada, la grabó,
 * la subió, y se olvidó de arrastrar la tarjeta. Otra: publicó algo que nunca planificó en
 * Zenovi. En los dos casos el tablero queda diciendo una verdad a medias.
 *
 * Zenovi no lo resuelve solo porque adivinar mal es peor que no saber, pero sí puede
 * mostrar el desajuste y dejar que se arregle en un click: enlazar la publicación con la
 * idea que ya existía, o registrarla como una pieza nueva ya publicada.
 */
import type { ContentKind } from "../content/library.ts";
import { pieceMatchText, textAffinity } from "./published-link.ts";

/** Una publicación real, con lo mínimo para reconocerla en pantalla. */
export type PublishedPiece = {
  id: string;
  postedAt: string;
  caption: string | null;
  thumbnailUrl: string | null;
  kind: ContentKind;
};

/** Una pieza del tablero, para cruzarla contra lo publicado. */
type BoardPiece = {
  id: string;
  title: string;
  hook: string;
  format: ContentKind;
  status: string;
  linkedMediaId: string | null;
};

/** Cuántas publicaciones sin registrar se muestran: el aviso no puede ser una lista infinita. */
const MAX_UNREGISTERED = 8;

/**
 * Las publicaciones que ninguna pieza del tablero reclama.
 *
 * Más reciente primero: lo de ayer es lo que el creador todavía tiene fresco y puede
 * reconocer de un vistazo; lo de hace dos meses ya no lo va a querer reconstruir.
 */
export function unregisteredPublications(
  published: readonly PublishedPiece[],
  items: readonly BoardPiece[],
  limit: number = MAX_UNREGISTERED,
): PublishedPiece[] {
  const claimed = new Set<string>();
  for (const item of items) {
    if (item.linkedMediaId !== null) claimed.add(item.linkedMediaId);
  }

  return published
    .filter((piece) => !claimed.has(piece.id))
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt))
    .slice(0, limit);
}

/**
 * Las piezas del tablero que podrían ser esta publicación, la más probable primero.
 *
 * Es el cruce inverso al de publicar: acá se parte de lo que salió y se busca la idea que
 * quedó trabada. Sólo compiten las que todavía no están publicadas ni atadas a otra cosa
 * —una pieza ya publicada no es esta— y del mismo formato.
 */
export function suggestBoardPieces<T extends BoardPiece>(
  items: readonly T[],
  publication: PublishedPiece,
  limit: number = 5,
): T[] {
  return items
    .filter(
      (item) =>
        item.status !== "publicada" &&
        item.linkedMediaId === null &&
        item.format === publication.kind,
    )
    .map((item) => ({
      item,
      ...textAffinity(pieceMatchText(item), publication.caption),
    }))
    .sort((a, b) => b.affinity - a.affinity)
    .slice(0, limit)
    .map((entry) => entry.item);
}

const titleDateFormatter = new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "long" });

const KIND_NAMES: Record<ContentKind, string> = {
  reel: "Reel",
  story: "Historia",
  publication: "Publicación",
};

/**
 * Cómo se llama una publicación que se registra desde cero.
 *
 * Primero las primeras palabras del caption, que es lo que el creador escribió. Si no
 * escribió nada —pasa seguido—, se la nombra por lo que sí sabemos: su formato y el día
 * que salió. No es inventarle un título, es describirla; y "Reel del 31 de agosto" se
 * reconoce en el tablero, mientras que "Sin título" repetido cuatro veces no.
 */
export function titleForPublication(publication: PublishedPiece, maxWords: number = 8): string {
  const fromCaption = firstWords(publication.caption, maxWords);
  if (fromCaption.length > 0) return fromCaption;

  const date = new Date(publication.postedAt);
  if (Number.isNaN(date.getTime())) return KIND_NAMES[publication.kind];

  return `${KIND_NAMES[publication.kind]} del ${titleDateFormatter.format(date)}`;
}

function firstWords(caption: string | null, maxWords: number): string {
  if (!caption) return "";

  const words = caption.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (words.length === 0) return "";

  const title = words.slice(0, maxWords).join(" ");
  return words.length > maxWords ? `${title}…` : title;
}
