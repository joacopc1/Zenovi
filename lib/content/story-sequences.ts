import type { RankedContentItem } from "@/lib/content/library";
import { median, MIN_BENCHMARK_SAMPLE } from "./metrics.ts";

export const STORY_SEQUENCE_TIME_ZONE = "America/Montevideo";

export type StorySequence = {
  id: string;
  stories: RankedContentItem[];
  startedAt: string;
  endedAt: string;
  totalReplies: number | null;
  totalProfileVisits: number | null;
  totalFollows: number | null;
  /** Personas que llegaron a la última Historia sobre las que vieron la primera. */
  completionRate: number | null;
};

/**
 * Meta no entrega un id de secuencia. Zenovi agrupa por día local de publicación, que
 * es la unidad estable y comprensible que el creador reconoce en su calendario.
 */
export function buildStorySequences(
  items: readonly RankedContentItem[],
  timeZone = STORY_SEQUENCE_TIME_ZONE,
): StorySequence[] {
  const stories = items
    .filter((item) => item.kind === "story" && Number.isFinite(Date.parse(item.postedAt)))
    .slice()
    .sort((left, right) => Date.parse(left.postedAt) - Date.parse(right.postedAt));
  const groups = new Map<string, RankedContentItem[]>();

  for (const story of stories) {
    const day = storyDay(story.postedAt, timeZone);
    const current = groups.get(day) ?? [];
    current.push(story);
    groups.set(day, current);
  }

  return [...groups.values()].map(toSequence).reverse();
}

function storyDay(value: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/**
 * La caída se mide en personas (alcance), no en views: una view se vuelve a contar cuando
 * alguien retrocede o la mira de nuevo, y eso haría parecer que la secuencia retiene más.
 */
export function storyReachChange(previous: RankedContentItem, current: RankedContentItem) {
  if (previous.reach === null || previous.reach <= 0 || current.reach === null) return null;
  return (current.reach - previous.reach) / previous.reach;
}

function toSequence(stories: RankedContentItem[]): StorySequence {
  const first = stories[0];
  const last = stories.at(-1) ?? first;

  return {
    id: first.id,
    stories,
    startedAt: first.postedAt,
    endedAt: last.postedAt,
    totalReplies: sumAvailable(stories.map((story) => story.replies)),
    totalProfileVisits: sumAvailable(stories.map((story) => story.profileVisits)),
    totalFollows: sumAvailable(stories.map((story) => story.follows)),
    completionRate: stories.length > 1 && first.reach && last.reach !== null ? last.reach / first.reach : null,
  };
}

function sumAvailable(values: Array<number | null>) {
  const available = values.filter((value): value is number => value !== null);
  return available.length > 0 ? available.reduce((sum, value) => sum + value, 0) : null;
}

export type SequenceKpiKey = "completion" | "lossPerStory" | "replies" | "profileVisits" | "follows";

export type SequenceComparison = {
  current: number;
  median: number;
  sampleSize: number;
  /** La ventana contra la que se compara: hasta esta inclusive, de la más vieja a la más nueva. */
  recent: Array<{ id: string; startedAt: string; value: number }>;
};

/**
 * Lo habitual se mide sobre las últimas secuencias y no sobre toda la historia: lo que
 * hacía la cuenta hace un año no define lo que hoy es normal para ella.
 */
const COMPARISON_WINDOW = 10;

/**
 * Cómo le fue a una secuencia frente a las demás de la misma cuenta.
 *
 * Respuestas, visitas y seguidores se comparan por cada 100 personas que empezaron la
 * secuencia y no en cantidad: un día con el doble de audiencia junta más respuestas sin que
 * la secuencia haya convencido más. Con menos de tres secuencias en la ventana no hay "lo habitual".
 */
export function compareWithOwnSequences(
  sequences: readonly StorySequence[],
  sequenceId: string,
  key: SequenceKpiKey,
): SequenceComparison | null {
  const measured = sequences
    .flatMap((sequence) => {
      const value = sequenceKpiRate(sequence, key);
      return value === null ? [] : [{ id: sequence.id, startedAt: sequence.startedAt, value }];
    })
    .toSorted((left, right) => Date.parse(left.startedAt) - Date.parse(right.startedAt));
  const index = measured.findIndex((entry) => entry.id === sequenceId);
  if (index === -1) return null;

  const recent = measured.slice(Math.max(0, index + 1 - COMPARISON_WINDOW), index + 1);
  if (recent.length < MIN_BENCHMARK_SAMPLE) return null;

  return {
    current: measured[index].value,
    median: median(recent.map((entry) => entry.value)),
    sampleSize: recent.length,
    recent,
  };
}

/** El número comparable de cada KPI: una proporción, o cada 100 personas que empezaron. */
export function sequenceKpiRate(sequence: StorySequence, key: SequenceKpiKey) {
  if (key === "completion") return sequence.completionRate;
  if (key === "lossPerStory") return lossPerStory(sequence);
  const total = sequenceKpiTotal(sequence, key);
  const started = sequence.stories[0].reach;
  return total === null || !started ? null : (total / started) * 100;
}

export function sequenceKpiTotal(sequence: StorySequence, key: Exclude<SequenceKpiKey, "completion" | "lossPerStory">) {
  if (key === "replies") return sequence.totalReplies;
  if (key === "profileVisits") return sequence.totalProfileVisits;
  return sequence.totalFollows;
}

/** Qué parte de las personas que empezaron sigue en cada Historia: la curva de abandono. */
export function storyRetention(sequence: StorySequence): Array<number | null> {
  const started = sequence.stories[0].reach;
  return sequence.stories.map((story) => (!started || story.reach === null ? null : story.reach / started));
}

/**
 * Cuánta gente se pierde, en promedio, en cada paso de una Historia a la siguiente.
 *
 * Es la tasa constante que, aplicada en cada paso, lleva de la primera a la última: así se
 * pueden comparar secuencias de largos distintos, que con lo que completó no se puede (una
 * de ocho Historias completa menos que una de tres sin haber retenido peor).
 */
export function lossPerStory(sequence: StorySequence) {
  const steps = sequence.stories.length - 1;
  if (steps < 1 || sequence.completionRate === null) return null;
  return 1 - sequence.completionRate ** (1 / steps);
}

/**
 * "Hoy" y "Ayer" se leen más rápido que una fecha; desde anteayer, la fecha. Cuenta días
 * de calendario de Uruguay, igual que la agrupación: no bloques de 24 h.
 */
export function sequenceDayLabel(startedAt: string, now = new Date(), timeZone = STORY_SEQUENCE_TIME_ZONE) {
  const day = storyDay(startedAt, timeZone);
  if (day === storyDay(now.toISOString(), timeZone)) return "Hoy";
  if (day === storyDay(new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), timeZone)) return "Ayer";

  const sameYear = day.slice(0, 4) === storyDay(now.toISOString(), timeZone).slice(0, 4);
  return new Intl.DateTimeFormat("es-UY", {
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone,
  }).format(new Date(startedAt));
}

/** Como Instagram arriba de cada Historia: minutos u horas en el día; después, Ayer o la fecha. */
export function storyAgeLabel(postedAt: string, now = new Date()) {
  const minutes = Math.max(0, Math.floor((now.getTime() - Date.parse(postedAt)) / 60_000));
  if (minutes < 60) return `Hace ${Math.max(1, minutes)} min`;
  if (minutes < 24 * 60) return `Hace ${Math.floor(minutes / 60)} h`;
  return sequenceDayLabel(postedAt, now);
}

export type StorySequenceSort = "recent" | "completion" | "replies" | "reach" | "stories";

export const STORY_SEQUENCE_SORTS: readonly StorySequenceSort[] = ["recent", "completion", "replies", "reach", "stories"];

const sequenceSortValue: Record<StorySequenceSort, (sequence: StorySequence) => number | null> = {
  recent: (sequence) => Date.parse(sequence.startedAt),
  completion: (sequence) => sequence.completionRate,
  replies: (sequence) => sequence.totalReplies,
  reach: (sequence) => sequence.stories[0].reach,
  stories: (sequence) => sequence.stories.length,
};

/** Ordena secuencias; las que no tienen el dato van al final en cualquier dirección. */
export function sortStorySequences(
  sequences: readonly StorySequence[],
  sort: StorySequenceSort,
  direction: "asc" | "desc",
) {
  const read = sequenceSortValue[sort];
  return sequences.toSorted((left, right) => {
    const a = read(left);
    const b = read(right);
    if (a === null || b === null) return a === null ? (b === null ? 0 : 1) : -1;
    return direction === "desc" ? b - a : a - b;
  });
}

export function parseStorySequenceSort(value: string | undefined): StorySequenceSort {
  return STORY_SEQUENCE_SORTS.includes(value as StorySequenceSort) ? (value as StorySequenceSort) : "recent";
}
