export type InstagramDailyMetric = {
  /** Día medido, `YYYY-MM-DD`. */
  date: string;
  label: string;
  /**
   * `null` significa que Instagram no informó ese día. No es un cero: un cero dibuja
   * una caída real donde en realidad no hay información, y la documentación de Meta es
   * explícita en que la API devuelve un conjunto vacío en lugar de valores en cero.
   */
  views: number | null;
  reach: number | null;
  interactions: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  profileViews: number | null;
  linkTaps: number | null;
  /** Foto de seguidores de ese día: un nivel, no un total del día. */
  followers: number | null;
};

export type DailyMetricKey = Exclude<keyof InstagramDailyMetric, "date" | "label">;

export type DailyInsightRow = {
  metric: string;
  end_time: string;
  value: number | string;
};

const metricKeys: Record<string, DailyMetricKey> = {
  views: "views",
  reach: "reach",
  total_interactions: "interactions",
  likes: "likes",
  comments: "comments",
  shares: "shares",
  saves: "saves",
  profile_views: "profileViews",
  profile_links_taps: "linkTaps",
  follower_count: "followers",
};

/** Métricas que describen un nivel en un momento; no se acumulan dentro del día. */
const snapshotKeys = new Set<DailyMetricKey>(["followers"]);

const dayFormatter = new Intl.DateTimeFormat("es-UY", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * Arma la serie diaria completa del período, dejando en `null` los días que Instagram
 * no informó. Los días existen siempre —para que el eje temporal no se deforme— pero
 * sin valor inventado.
 *
 * La serie termina ayer: el día en curso todavía no cerró y nadie lo informa hasta
 * mañana. Cada fila se ubica en el día que mide, no en el que figura en `end_time`:
 * Meta fecha cada día por su cierre, así que una fila con `end_time` del 13 contiene
 * lo que pasó el 12.
 */
export function buildDailyMetricSeries(
  rows: DailyInsightRow[],
  now: Date,
  dayCount: number,
): InstagramDailyMetric[] {
  const days: InstagramDailyMetric[] = Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(now.getTime() - (dayCount - index) * DAY_IN_MS);

    return {
      date: date.toISOString().slice(0, 10),
      label: dayFormatter.format(date),
      views: null,
      reach: null,
      interactions: null,
      likes: null,
      comments: null,
      shares: null,
      saves: null,
      profileViews: null,
      linkTaps: null,
      followers: null,
    };
  });
  const points = new Map(days.map((day) => [day.date, day]));

  for (const row of rows) {
    const endTime = new Date(row.end_time).getTime();
    if (!Number.isFinite(endTime)) continue;

    const point = points.get(new Date(endTime - DAY_IN_MS).toISOString().slice(0, 10));
    const key = metricKeys[row.metric];
    if (!point || !key) continue;

    const value = toNonNegativeNumber(row.value);
    // El día pasa de "sin informar" a un valor sólo cuando llegó una fila real.
    point[key] = snapshotKeys.has(key) ? value : (point[key] ?? 0) + value;
  }

  return days;
}

function toNonNegativeNumber(value: number | string) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
