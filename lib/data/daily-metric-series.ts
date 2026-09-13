export type InstagramDailyMetric = {
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
};

export type DailyInsightRow = {
  metric: string;
  end_time: string;
  value: number | string;
};

const metricKeys = {
  views: "views",
  reach: "reach",
  total_interactions: "interactions",
} as const;

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
 */
export function buildDailyMetricSeries(
  rows: DailyInsightRow[],
  now: Date,
  dayCount: number,
): InstagramDailyMetric[] {
  const days: InstagramDailyMetric[] = Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(now.getTime() - (dayCount - 1 - index) * DAY_IN_MS);

    return {
      date: date.toISOString().slice(0, 10),
      label: dayFormatter.format(date),
      views: null,
      reach: null,
      interactions: null,
    };
  });
  const points = new Map(days.map((day) => [day.date, day]));

  for (const row of rows) {
    const timestamp = new Date(row.end_time);
    if (!Number.isFinite(timestamp.getTime())) continue;

    const point = points.get(timestamp.toISOString().slice(0, 10));
    const key = metricKeys[row.metric as keyof typeof metricKeys];
    if (!point || !key) continue;

    // El día pasa de "sin informar" a un valor sólo cuando llegó una fila real.
    point[key] = (point[key] ?? 0) + toNonNegativeNumber(row.value);
  }

  return days;
}

function toNonNegativeNumber(value: number | string) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
