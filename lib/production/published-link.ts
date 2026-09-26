/**
 * Atar una pieza planificada con la que realmente se publicó.
 *
 * Es el cierre del ciclo: el creador planificó algo, lo grabó y lo subió; recién cuando
 * Zenovi sabe cuál de las piezas publicadas es esa idea puede contestar "¿cómo me
 * rindió?". Nadie va a pegar un id a mano, así que la app propone candidatas y la
 * persona confirma.
 *
 * Acá vive sólo la elección de candidatas, sin tocar la base ni la pantalla, porque es
 * la parte que se puede equivocar en silencio: proponer una pieza de otro formato, una
 * que ya pertenece a otra idea, o dejar arriba la menos parecida.
 */
import type { ContentKind } from "@/lib/content/library";
import type { ContentFormat } from "@/lib/production/content";

/** Lo mínimo que necesita una pieza publicada para ser candidata. */
type Publishable = { id: string; kind: ContentKind; postedAt: string };

/** Lo mínimo que necesita una pieza planificada para buscar su publicación. */
type Planned = {
  id: string;
  format: ContentFormat;
  targetDate: string | null;
  linkedMediaId: string | null;
};

/** Cuántas candidatas se ofrecen: una lista larga obliga a comparar en vez de reconocer. */
const MAX_CANDIDATES = 6;

/**
 * Las piezas publicadas que ya pertenecen a otra idea.
 *
 * Una publicación real corresponde a una sola idea: ofrecerla dos veces dejaría dos
 * piezas del tablero midiéndose contra el mismo Reel y ninguna diría la verdad.
 */
export function takenMediaIds(items: readonly Planned[], exceptItemId?: string): Set<string> {
  const taken = new Set<string>();

  for (const item of items) {
    if (item.id === exceptItemId) continue;
    if (item.linkedMediaId !== null) taken.add(item.linkedMediaId);
  }

  return taken;
}

/**
 * Las publicaciones que pueden ser esta pieza, la más probable primero.
 *
 * Se filtra por formato —un Reel no se publicó como Historia— y se ordena por cercanía
 * a la fecha objetivo, que es la pista más fuerte que hay: si alguien planificó algo
 * para el miércoles, lo que subió el miércoles es casi seguro eso. Sin fecha objetivo
 * manda lo más reciente, que es lo que se acaba de publicar.
 */
export function rankPublishCandidates<T extends Publishable>(
  published: readonly T[],
  piece: { format: ContentFormat; targetDate: string | null },
  taken: ReadonlySet<string>,
  limit: number = MAX_CANDIDATES,
): T[] {
  const scored = published
    .filter((media) => media.kind === piece.format && !taken.has(media.id))
    .map((media) => ({
      media,
      distance: piece.targetDate === null ? null : daysApart(piece.targetDate, media.postedAt),
    }));

  scored.sort((a, b) => {
    if (a.distance !== null && b.distance !== null && a.distance !== b.distance) {
      return a.distance - b.distance;
    }
    return b.media.postedAt.localeCompare(a.media.postedAt);
  });

  return scored.slice(0, limit).map((entry) => entry.media);
}

/**
 * Días entre una fecha objetivo ("YYYY-MM-DD") y una publicación (marca de tiempo).
 * Se comparan como días UTC: la hora exacta no aporta nada y arrastraría la zona horaria
 * del servidor a una cuenta que el creador piensa en días.
 */
function daysApart(targetDate: string, postedAt: string): number {
  const target = Date.parse(`${targetDate}T00:00:00Z`);
  const posted = Date.parse(`${postedAt.slice(0, 10)}T00:00:00Z`);

  if (Number.isNaN(target) || Number.isNaN(posted)) return Number.MAX_SAFE_INTEGER;

  return Math.abs(target - posted) / 86_400_000;
}
