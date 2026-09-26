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
type Publishable = { id: string; kind: ContentKind; postedAt: string; caption: string | null };

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
 * El texto de la pieza con el que se la busca entre lo publicado.
 *
 * Título y hook, no el guion entero: el desarrollo es lo que se dice en cámara y casi
 * nunca se escribe en el caption, así que sumarlo agrega palabras que nunca van a
 * coincidir y hunde la proporción de la candidata correcta.
 */
export function pieceMatchText(piece: { title: string; hook: string }): string {
  return `${piece.title} ${piece.hook}`.trim();
}

/** Palabras cortas ("de", "un", "mi") aparecen en cualquier caption y no distinguen nada. */
const MIN_WORD_LENGTH = 4;

/**
 * Palabras largas que tampoco distinguen: son el andamio del idioma, no el tema de la
 * pieza. Sin esta lista, "Cómo vender más" y "Cómo cocinar más" coincidirían en dos de
 * tres palabras y Zenovi ataría la pieza equivocada creyendo que está seguro.
 */
const FILLER_WORDS = new Set([
  "para", "como", "pero", "porque", "cuando", "donde", "sobre", "entre", "desde", "hasta",
  "este", "esta", "esto", "estos", "estas", "eso", "esos", "esas", "aquel",
  "todo", "toda", "todos", "todas", "cada", "otro", "otra", "otros", "otras",
  "muy", "mas", "menos", "tambien", "solo", "bien", "nada", "algo", "quien",
  "tiene", "tienen", "hacer", "hace", "haces", "puede", "pueden", "estar", "estan",
  "tener", "vamos", "quiero", "queres", "sabes", "viste",
]);

/** Desde acá la coincidencia de texto deja de ser casualidad. */
const STRONG_AFFINITY = 0.6;

/** Una sola palabra en común es azar; dos ya es la misma idea escrita dos veces. */
const MIN_STRONG_WORDS = 2;

/**
 * Cuánto se parece lo que el creador escribió a lo que terminó publicando.
 *
 * Es la única señal que no depende de cuándo la persona movió la tarjeta: puede subir el
 * Reel el lunes y acordarse de arrastrarla el jueves —y ese jueves haber subido otro—,
 * pero el título y el hook que escribió siguen estando en el caption. Devuelve qué
 * proporción de las palabras propias de la pieza aparece en el texto publicado.
 */
export function textAffinity(
  pieceText: string,
  caption: string | null,
): { affinity: number; matchedWords: number } {
  const words = significantWords(pieceText);
  if (words.size === 0 || !caption) return { affinity: 0, matchedWords: 0 };

  const published = normalize(caption);
  let matchedWords = 0;
  for (const word of words) {
    if (published.includes(word)) matchedWords += 1;
  }

  return { affinity: matchedWords / words.size, matchedWords };
}

/** Una candidata con las dos señales que la sostienen. */
export type ScoredCandidate<T> = {
  media: T;
  affinity: number;
  matchedWords: number;
  /** Días entre la fecha objetivo y la publicación; `null` cuando no hay fecha objetivo. */
  distance: number | null;
};

/**
 * Las publicaciones que pueden ser esta pieza, la más probable primero.
 *
 * Se filtra por formato —un Reel no se publicó como Historia— y manda el parecido del
 * texto. La fecha sólo desempata: es una pista floja, porque nadie mueve la tarjeta el
 * mismo día que publica, y el día que se acuerda puede haber subido otra cosa.
 */
export function scorePublishCandidates<T extends Publishable>(
  published: readonly T[],
  piece: { format: ContentFormat; targetDate: string | null; text: string },
  taken: ReadonlySet<string>,
  limit: number = MAX_CANDIDATES,
): ScoredCandidate<T>[] {
  const scored = published
    .filter((media) => media.kind === piece.format && !taken.has(media.id))
    .map((media) => ({
      media,
      ...textAffinity(piece.text, media.caption),
      distance: piece.targetDate === null ? null : daysApart(piece.targetDate, media.postedAt),
    }));

  scored.sort((a, b) => {
    if (a.affinity !== b.affinity) return b.affinity - a.affinity;
    if (a.distance !== null && b.distance !== null && a.distance !== b.distance) {
      return a.distance - b.distance;
    }
    return b.media.postedAt.localeCompare(a.media.postedAt);
  });

  return scored.slice(0, limit);
}

/**
 * La publicación que Zenovi puede atar sin preguntar.
 *
 * Sólo cuando el texto coincide fuerte y ninguna otra se le acerca: un vínculo
 * equivocado es peor que ninguno, porque muestra un veredicto que no es de esa pieza y
 * nadie sospecha de un número que la app afirma sola. Ante cualquier duda devuelve
 * `null` y la pieza queda sin atar, sin molestar a nadie.
 */
export function autoMatch<T extends Publishable>(candidates: readonly ScoredCandidate<T>[]): T | null {
  const [best, runnerUp] = candidates;

  if (!best || best.affinity < STRONG_AFFINITY || best.matchedWords < MIN_STRONG_WORDS) return null;
  if (runnerUp && runnerUp.affinity >= best.affinity / 2) return null;

  return best.media;
}

/** Las palabras propias de un texto: en minúscula, sin tildes, sin las cortas y sin relleno. */
function significantWords(text: string): Set<string> {
  const words = new Set<string>();

  for (const word of normalize(text).split(" ")) {
    if (word.length >= MIN_WORD_LENGTH && !FILLER_WORDS.has(word)) words.add(word);
  }

  return words;
}

/** Minúsculas, sin tildes y sin puntuación: "Guión #1, ¡ya!" y "guion 1 ya" son lo mismo. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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
