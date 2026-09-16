import type { DailyMetricKey, InstagramDailyMetric } from "../data/daily-metric-series";

export type EngagementPart = "likes" | "comments" | "saves" | "shares";

/** Orden fijo: define el color de cada parte y nunca depende de cuál es mayor. */
export const ENGAGEMENT_PARTS: readonly EngagementPart[] = ["likes", "comments", "saves", "shares"];

/** Debajo de este volumen una proporción describe casualidades, no un patrón. */
const MIN_INTERACTIONS_FOR_READING = 20;

/** Cuántos días de cada día de la semana hacen falta para señalar uno como el mejor. */
const MIN_DAYS_PER_WEEKDAY = 2;

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

/** Cociente que no inventa: sin numerador, sin denominador o con denominador cero, no hay tasa. */
export function ratio(numerator: number | null, denominator: number | null) {
  if (numerator === null || denominator === null || denominator === 0) return null;
  return numerator / denominator;
}

export type CompositionSlice = { part: EngagementPart; value: number; share: number };

/** Reparto de las interacciones por tipo. `null` si no hay ninguna que repartir. */
export function engagementComposition(
  totals: Record<EngagementPart, number | null>,
): CompositionSlice[] | null {
  const total = ENGAGEMENT_PARTS.reduce((sum, part) => sum + (totals[part] ?? 0), 0);
  if (total === 0) return null;

  return ENGAGEMENT_PARTS.map((part) => ({
    part,
    value: totals[part] ?? 0,
    share: (totals[part] ?? 0) / total,
  }));
}

/**
 * Lectura del reparto en una frase. Es una regla fija, no IA: dice qué tipo de
 * interacción predomina y qué suele significar. Con poco volumen no afirma nada.
 */
export function readEngagement(composition: CompositionSlice[] | null) {
  if (!composition) return null;

  const byPart = new Map(composition.map((slice) => [slice.part, slice]));
  const total = composition.reduce((sum, slice) => sum + slice.value, 0);
  if (total < MIN_INTERACTIONS_FOR_READING) return null;

  const saves = byPart.get("saves")!;
  const shares = byPart.get("shares")!;
  const comments = byPart.get("comments")!;
  const likes = byPart.get("likes")!;

  if (saves.share + shares.share >= 0.5) {
    return "La mitad o más de tus interacciones son guardados y compartidos: tu contenido se usa y se recomienda, no sólo se aprueba.";
  }
  if (likes.share >= 0.7) {
    return "Casi todo son me gusta: el contenido agrada, pero todavía provoca poca acción.";
  }
  if (saves.value > comments.value) {
    return "Recibís más guardados que comentarios: tu contenido funciona como material de referencia.";
  }
  if (comments.value > saves.value) {
    return "Recibís más comentarios que guardados: tu contenido abre conversación.";
  }
  return null;
}

export type WeekdayAverage = { weekday: string; average: number | null; days: number };

/** Promedio diario de una métrica según el día de la semana, de lunes a domingo. */
export function averageByWeekday(
  points: readonly InstagramDailyMetric[],
  key: DailyMetricKey,
): WeekdayAverage[] {
  const sums = WEEKDAYS.map(() => ({ total: 0, days: 0 }));

  for (const point of points) {
    const value = point[key];
    if (value === null) continue;

    // `date` es un día calendario; getUTCDay evita que el huso local lo corra.
    const index = (new Date(`${point.date}T00:00:00Z`).getUTCDay() + 6) % 7;
    sums[index].total += value;
    sums[index].days += 1;
  }

  return WEEKDAYS.map((weekday, index) => ({
    weekday,
    days: sums[index].days,
    average: sums[index].days === 0 ? null : sums[index].total / sums[index].days,
  }));
}

/** El día con mayor promedio, sólo si todos los días de la semana tienen base suficiente. */
export function strongestWeekday(averages: readonly WeekdayAverage[]) {
  if (averages.some((entry) => entry.days < MIN_DAYS_PER_WEEKDAY || entry.average === null)) {
    return null;
  }

  const best = averages.reduce((top, entry) => ((entry.average ?? 0) > (top.average ?? 0) ? entry : top));
  return (best.average ?? 0) > 0 ? best : null;
}

/** Promedio por día informado. Válido para métricas de cuentas únicas, como el alcance. */
export function averagePerReportedDay(points: readonly InstagramDailyMetric[], key: DailyMetricKey) {
  const reported = points.map((point) => point[key]).filter((value) => value !== null);
  return reported.length === 0 ? null : reported.reduce((sum, value) => sum + value, 0) / reported.length;
}

/**
 * Cambio neto de seguidores entre la primera y la última foto del período, y su promedio
 * por día. Es neto —nuevos menos bajas—: separarlos requiere un dato que Meta sólo da a
 * cuentas con 100 seguidores o más. Hacen falta dos fotos.
 */
export function followerChange(points: readonly InstagramDailyMetric[]) {
  const snapshots = points.filter((point) => point.followers !== null);
  if (snapshots.length < 2) return null;

  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  const change = last.followers! - first.followers!;
  // Días transcurridos, no cantidad de fotos: si falta un día, el promedio no se infla.
  const days = Math.round((Date.parse(`${last.date}T00:00:00Z`) - Date.parse(`${first.date}T00:00:00Z`)) / 86_400_000);

  return {
    change,
    from: first.date,
    to: last.date,
    snapshots: snapshots.length,
    days,
    perDay: days > 0 ? change / days : null,
  };
}

/** Piezas publicadas entre dos días calendario, inclusive. */
export function countPublished(postedAt: readonly string[], fromDate: string, toDate: string) {
  return postedAt.filter((timestamp) => {
    const day = timestamp.slice(0, 10);
    return day >= fromDate && day <= toDate;
  }).length;
}

export type PublishedBucket = { label: string; count: number };

const WEEKDAY_INITIALS = ["D", "L", "M", "M", "J", "V", "S"];

/**
 * Cuántas piezas se publicaron en cada tramo del período, para leerlo como barras.
 *
 * El tramo se elige por el largo del período —día, semana o quincena— para que nunca
 * haya más de siete u ocho barras: más que eso deja de leerse de un vistazo. Los
 * tramos se arman desde el final, así el último siempre termina en el día más
 * reciente y el recorte, si lo hay, cae en el tramo más viejo.
 */
export function publishedBuckets(
  postedAt: readonly string[],
  days: readonly string[],
): PublishedBucket[] {
  if (days.length === 0) return [];

  const perDay = new Map<string, number>();
  for (const timestamp of postedAt) {
    const day = timestamp.slice(0, 10);
    if (day >= days[0] && day <= days[days.length - 1]) {
      perDay.set(day, (perDay.get(day) ?? 0) + 1);
    }
  }

  const size = days.length <= 7 ? 1 : days.length <= 35 ? 7 : 14;
  const buckets: PublishedBucket[] = [];

  for (let end = days.length; end > 0; end -= size) {
    const span = days.slice(Math.max(0, end - size), end);
    buckets.unshift({
      label: size === 1 ? weekdayInitial(span[0]) : shortDay(span[0]),
      count: span.reduce((total, day) => total + (perDay.get(day) ?? 0), 0),
    });
  }

  return buckets;
}

function weekdayInitial(day: string) {
  return WEEKDAY_INITIALS[new Date(`${day}T00:00:00Z`).getUTCDay()];
}

function shortDay(day: string) {
  return `${Number(day.slice(8, 10))}/${Number(day.slice(5, 7))}`;
}
