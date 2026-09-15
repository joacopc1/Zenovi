/**
 * Totales de período que Meta calcula por su cuenta y que no se pueden reconstruir
 * sumando días: el alcance cuenta cuentas únicas, y los desgloses por tipo de contenido
 * y por seguidores sólo existen como total de una ventana.
 *
 * Se guardan en `instagram_account_insights` sin tocar el esquema:
 * - `period` es `window_{días}d`;
 * - el desglose va en `metric` como `{métrica}.{dimensión}.{valor}`,
 *   por ejemplo `views.follow_type.FOLLOWER`.
 */

export const PERIOD_WINDOW_DAYS = [7, 30, 90] as const;
export type PeriodWindowDays = (typeof PERIOD_WINDOW_DAYS)[number];

export type PeriodWindow = { days: PeriodWindowDays; since: number; until: number; end: string };

const DAY_SECONDS = 24 * 60 * 60;

/** Ventanas que terminan en la última medianoche UTC: sólo días ya cerrados. */
export function buildPeriodWindows(now: Date): PeriodWindow[] {
  const until = Math.floor(now.getTime() / 1000 / DAY_SECONDS) * DAY_SECONDS;

  return PERIOD_WINDOW_DAYS.map((days) => ({
    days,
    since: until - days * DAY_SECONDS,
    until,
    end: new Date(until * 1000).toISOString(),
  }));
}

export function periodKey(days: PeriodWindowDays) {
  return `window_${days}d`;
}

export function breakdownMetricKey(metric: string, dimension: string, value: string) {
  return `${metric}.${dimension}.${value}`;
}

export type StoredPeriodRow = {
  metric: string;
  period: string;
  value: number | string;
  end_time: string;
  synced_at: string;
};

export type ContentType = "reels" | "posts" | "stories" | "other";

export type PeriodBreakdown = {
  days: PeriodWindowDays;
  /** Primer y último día medido, inclusive. */
  fromDate: string;
  toDate: string;
  syncedAt: string;
  reach: number | null;
  viewsByContent: { type: ContentType; value: number }[] | null;
  viewsByAudience: { followers: number; nonFollowers: number } | null;
};

/**
 * Cómo agrupa Instagram en su panel: un carrusel es una publicación más, no una
 * categoría aparte. Lo que no tenga equivalente claro va a "otros".
 */
const CONTENT_TYPE_BY_API_VALUE: Record<string, ContentType> = {
  REEL: "reels",
  POST: "posts",
  CAROUSEL_CONTAINER: "posts",
  STORY: "stories",
};

const CONTENT_ORDER: ContentType[] = ["reels", "posts", "stories", "other"];

/** Una lectura por período: la de la sincronización más reciente de cada ventana. */
export function buildPeriodBreakdowns(rows: readonly StoredPeriodRow[]): PeriodBreakdown[] {
  return PERIOD_WINDOW_DAYS.flatMap((days) => {
    const periodRows = rows.filter((row) => row.period === periodKey(days));
    if (periodRows.length === 0) return [];

    const latestSync = periodRows.reduce((latest, row) => (row.synced_at > latest ? row.synced_at : latest), "");
    const current = periodRows.filter((row) => row.synced_at === latestSync);
    const end = Date.parse(current[0].end_time);
    const numeric = (row: StoredPeriodRow) => {
      const parsed = Number(row.value);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    };

    const reachRow = current.find((row) => row.metric === "reach");

    const byContent = new Map<ContentType, number>();
    for (const row of current) {
      const prefix = "views.media_product_type.";
      if (!row.metric.startsWith(prefix)) continue;
      const type = CONTENT_TYPE_BY_API_VALUE[row.metric.slice(prefix.length)] ?? "other";
      byContent.set(type, (byContent.get(type) ?? 0) + numeric(row));
    }

    const followers = current.find((row) => row.metric === "views.follow_type.FOLLOWER");
    const nonFollowers = current.find((row) => row.metric === "views.follow_type.NON_FOLLOWER");

    return [{
      days,
      fromDate: new Date(end - days * DAY_SECONDS * 1000).toISOString().slice(0, 10),
      toDate: new Date(end - DAY_SECONDS * 1000).toISOString().slice(0, 10),
      syncedAt: latestSync,
      reach: reachRow ? numeric(reachRow) : null,
      viewsByContent:
        byContent.size === 0
          ? null
          : CONTENT_ORDER.filter((type) => type !== "other" || (byContent.get("other") ?? 0) > 0).map((type) => ({
              type,
              value: byContent.get(type) ?? 0,
            })),
      // Meta omite la parte que vale cero: si llegó al menos una, la consulta funcionó y la
      // que falta es cero. Si no llegó ninguna, no hay reparto que afirmar.
      viewsByAudience:
        followers || nonFollowers
          ? {
              followers: followers ? numeric(followers) : 0,
              nonFollowers: nonFollowers ? numeric(nonFollowers) : 0,
            }
          : null,
    }];
  });
}
