import "server-only";

import {
  ACCOUNT_CURRENT_TOTAL_PERIOD,
  ACCOUNT_PREVIOUS_TOTAL_PERIOD,
  buildAccountMetricSummaries,
  type StoredAccountInsight,
} from "@/lib/data/account-metric-summaries";
import {
  buildDailyMetricSeries,
  type InstagramDailyMetric,
} from "@/lib/data/daily-metric-series";
import { REPORTING_DELAY_DAYS } from "@/lib/analytics/period-totals";
import {
  ACCOUNT_INSIGHT_LOOKBACK_DAYS,
} from "@/lib/meta/insight-periods";
import { createClient } from "@/lib/supabase/server";

export type { InstagramDailyMetric };

/**
 * La serie incluye el margen de demora de Meta además del período máximo: los días
 * más recientes todavía pueden no haber cerrado, y sin ese margen el período de 90
 * días se quedaría con 89 días cerrados aunque la base tenga los 90.
 */
const DAILY_SERIES_DAYS = ACCOUNT_INSIGHT_LOOKBACK_DAYS + REPORTING_DELAY_DAYS;

type InstagramMediaRow = {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_product_type: string | null;
  permalink: string | null;
  posted_at: string;
  like_count: number | null;
  comments_count: number | null;
  synced_at: string;
};

type InstagramInsightRow = {
  instagram_media_id: string;
  metric: string;
  value: number | string;
};

type InstagramAccountInsightRow = StoredAccountInsight & {
  end_time: string;
};

export type InstagramContentSummary = {
  id: string;
  contentLabel: string;
  dateLabel: string;
  views: number | null;
  reach: number | null;
  interactions: number | null;
  likes: number | null;
  comments: number | null;
  saves: number | null;
  shares: number | null;
  averageWatchTimeMs: number | null;
  totalWatchTimeMs: number | null;
  skipRate: number | null;
  permalink: string | null;
};

export type InstagramDashboardData = {
  username: string;
  followers: number | null;
  sevenDayReach: number;
  sevenDayViews: number;
  sevenDayInteractions: number;
  previousSevenDayReach: number;
  previousSevenDayViews: number;
  previousSevenDayInteractions: number;
  availableAccountMetrics: string[];
  availableDailyMetrics: string[];
  accountMetricSummaries: InstagramAccountMetricSummary[];
  syncedMediaCount: number;
  totalMediaInteractions: number | null;
  lastSyncedAt: string | null;
  dailyMetrics: InstagramDailyMetric[];
  /** Fechas de publicación dentro del período máximo. */
  publishedDates: string[];
  topContent: InstagramContentSummary[];
  priority: {
    contentLabel: string;
    dateLabel: string;
    views: number | null;
    reach: number;
    interactions: number | null;
    reachMultiplier: number | null;
    runnerUpReach: number | null;
    permalink: string | null;
  } | null;
};

export type InstagramAccountMetricSummary = {
  metric: string;
  current: number;
  previous: number | null;
};

export async function getInstagramDashboardData(
  workspaceId: string,
): Promise<InstagramDashboardData | null> {
  const supabase = await createClient();
  const { data: connection, error: connectionError } = await supabase
    .from("social_connections")
    .select("id, connected_at")
    .eq("workspace_id", workspaceId)
    .eq("provider", "instagram")
    .eq("status", "connected")
    .maybeSingle();

  if (connectionError) throw new Error("No pudimos cargar la conexión de Instagram.");
  if (!connection) return null;

  const { data: account, error: accountError } = await supabase
    .from("social_accounts")
    .select("id, username, followers_count")
    .eq("connection_id", connection.id)
    .maybeSingle();

  if (accountError) throw new Error("No pudimos cargar la cuenta de Instagram.");
  if (!account) return null;

  const now = new Date();
  const insightBoundary = new Date(
    now.getTime() - DAILY_SERIES_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const [
    { data: media, error: mediaError },
    { data: dailyInsights, error: insightsError },
    { data: summaryInsights, error: summariesError },
    { data: publishedMedia, error: publishedError },
  ] =
    await Promise.all([
      supabase
        .from("instagram_media")
        .select(
          "id, media_type, media_product_type, permalink, posted_at, like_count, comments_count, synced_at",
        )
        .eq("social_account_id", account.id)
        .order("posted_at", { ascending: false })
        .limit(50),
      // Serie diaria: una fila por métrica y día dentro del período (~10 × 92 filas).
      supabase
        .from("instagram_account_insights")
        .select("metric, period, value, end_time, synced_at")
        .eq("social_account_id", account.id)
        .eq("period", "day")
        .gte("end_time", insightBoundary),
      // Totales de 7 días: cada sincronización agrega una tanda nueva, así que se leen
      // sólo las más recientes. Mezclados con la serie, con el cron diario superarían el
      // tope de filas de Supabase y la consulta llegaría cortada sin avisar.
      supabase
        .from("instagram_account_insights")
        .select("metric, period, value, end_time, synced_at")
        .eq("social_account_id", account.id)
        .in("period", [ACCOUNT_CURRENT_TOTAL_PERIOD, ACCOUNT_PREVIOUS_TOTAL_PERIOD])
        .order("synced_at", { ascending: false })
        .limit(60),
      // Fechas de publicación del período, para contar cuánto contenido salió.
      supabase
        .from("instagram_media")
        .select("posted_at")
        .eq("social_account_id", account.id)
        .gte("posted_at", insightBoundary),
    ]);

  if (mediaError || insightsError || summariesError || publishedError) {
    throw new Error("No pudimos cargar las métricas de Instagram.");
  }

  const mediaRows = (media ?? []) as InstagramMediaRow[];
  const mediaIds = mediaRows.map((item) => item.id);
  let mediaInsights: InstagramInsightRow[] = [];

  if (mediaIds.length > 0) {
    const { data, error } = await supabase
      .from("instagram_media_insights")
      .select("instagram_media_id, metric, value")
      .in("instagram_media_id", mediaIds);

    if (error) throw new Error("No pudimos cargar el rendimiento del contenido.");
    mediaInsights = (data ?? []) as InstagramInsightRow[];
  }

  const dailyInsightRows = (dailyInsights ?? []) as InstagramAccountInsightRow[];
  const summaryInsightRows = (summaryInsights ?? []) as InstagramAccountInsightRow[];
  const accountInsightRows = [...dailyInsightRows, ...summaryInsightRows];
  const summaries = buildAccountMetricSummaries(summaryInsightRows);
  const summaryByMetric = new Map(summaries.map((summary) => [summary.metric, summary]));
  // Toda métrica con serie diaria entra; `buildDailyMetricSeries` ignora las que no
  // sabe mapear. Filtrar por `reach` acá descartaba series que sí llegaron.
  const dailyRows = dailyInsightRows;
  const dailyMetricsAvailable = new Set(dailyRows.map((row) => row.metric));
  const mediaMetrics = new Map<string, Map<string, number>>();

  for (const insight of mediaInsights) {
    const metrics = mediaMetrics.get(insight.instagram_media_id) ?? new Map<string, number>();
    metrics.set(insight.metric, toNumber(insight.value));
    mediaMetrics.set(insight.instagram_media_id, metrics);
  }

  const rankedMedia = mediaRows
    .map((item) => {
      const metrics = mediaMetrics.get(item.id);

      return {
        item,
        views: metrics?.get("views") ?? null,
        reach: metrics?.get("reach") ?? null,
        interactions: metrics?.get("total_interactions") ?? null,
        likes: metrics?.get("likes") ?? item.like_count,
        comments: metrics?.get("comments") ?? item.comments_count,
        saves: metrics?.get("saved") ?? null,
        shares: metrics?.get("shares") ?? null,
        averageWatchTimeMs: metrics?.get("ig_reels_avg_watch_time") ?? null,
        totalWatchTimeMs: metrics?.get("ig_reels_video_view_total_time") ?? null,
        skipRate: metrics?.get("reels_skip_rate") ?? null,
      };
    })
    .sort((a, b) => performanceScore(b) - performanceScore(a));

  const comparableByReach = rankedMedia.filter(
    (entry): entry is typeof entry & { reach: number } => entry.reach !== null,
  );
  const priority = comparableByReach[0];
  const nextBestReach = comparableByReach[1]?.reach ?? null;
  const topContent = rankedMedia.slice(0, 10).map(({ item, ...metrics }) => ({
    id: item.id,
    contentLabel: getContentLabel(item),
    dateLabel: formatMediaDate(item.posted_at),
    ...metrics,
    permalink: item.permalink,
  }));

  return {
    username: account.username,
    followers: account.followers_count,
    sevenDayReach: summaryByMetric.get("reach")?.current ?? 0,
    sevenDayViews: summaryByMetric.get("views")?.current ?? 0,
    sevenDayInteractions: summaryByMetric.get("total_interactions")?.current ?? 0,
    previousSevenDayReach: summaryByMetric.get("reach")?.previous ?? 0,
    previousSevenDayViews: summaryByMetric.get("views")?.previous ?? 0,
    previousSevenDayInteractions: summaryByMetric.get("total_interactions")?.previous ?? 0,
    availableAccountMetrics: summaries.map((summary) => summary.metric),
    availableDailyMetrics: [...dailyMetricsAvailable],
    accountMetricSummaries: summaries,
    syncedMediaCount: mediaRows.length,
    totalMediaInteractions: sumAvailable(rankedMedia.map((item) => item.interactions)),
    dailyMetrics: buildDailyMetricSeries(
      dailyRows,
      now,
      DAILY_SERIES_DAYS,
    ),
    topContent,
    publishedDates: (publishedMedia ?? []).map((item) => item.posted_at as string),
    lastSyncedAt: findLatestTimestamp([
      connection.connected_at,
      ...mediaRows.map((item) => item.synced_at),
      ...accountInsightRows.map((item) => item.synced_at),
    ]),
    priority: priority
      ? {
          contentLabel: getContentLabel(priority.item),
          dateLabel: formatMediaDate(priority.item.posted_at),
          views: priority.views,
          reach: priority.reach,
          interactions: priority.interactions,
          reachMultiplier:
            nextBestReach !== null && nextBestReach > 0 && priority.reach > nextBestReach
              ? priority.reach / nextBestReach
              : null,
          runnerUpReach: nextBestReach,
          permalink: priority.item.permalink,
        }
      : null,
  };
}

function performanceScore(entry: { reach: number | null; views: number | null }) {
  return entry.reach ?? entry.views ?? -1;
}

function sumAvailable(values: (number | null)[]) {
  const available = values.filter((value): value is number => value !== null);
  return available.length === 0 ? null : available.reduce((total, value) => total + value, 0);
}


function findLatestTimestamp(values: (string | null)[]) {
  const timestamps = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite);

  return timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : null;
}

function toNumber(value: number | string) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function getContentLabel(media: InstagramMediaRow) {
  if (media.media_product_type === "REELS") return "Reel";
  if (media.media_type === "CAROUSEL_ALBUM") return "Carrusel";
  if (media.media_type === "VIDEO") return "Video";
  return "Publicación";
}

function formatMediaDate(value: string) {
  return new Intl.DateTimeFormat("es-UY", {
    day: "numeric",
    month: "long",
    timeZone: "America/Montevideo",
  }).format(new Date(value));
}
