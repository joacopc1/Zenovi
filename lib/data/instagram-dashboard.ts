import "server-only";

import { createClient } from "@/lib/supabase/server";

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

export type InstagramDashboardData = {
  username: string;
  followers: number;
  sevenDayReach: number;
  sevenDayViews: number;
  sevenDayInteractions: number;
  previousSevenDayReach: number;
  previousSevenDayViews: number;
  previousSevenDayInteractions: number;
  availableAccountMetrics: string[];
  syncedMediaCount: number;
  totalMediaInteractions: number;
  lastSyncedAt: string | null;
  priority: {
    contentLabel: string;
    dateLabel: string;
    views: number;
    reach: number;
    interactions: number;
    reachMultiplier: number | null;
    runnerUpReach: number;
    permalink: string | null;
  } | null;
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
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: media, error: mediaError }, { data: accountInsights, error: insightsError }] =
    await Promise.all([
      supabase
        .from("instagram_media")
        .select(
          "id, media_type, media_product_type, permalink, posted_at, like_count, comments_count, synced_at",
        )
        .eq("social_account_id", account.id)
        .order("posted_at", { ascending: false })
        .limit(50),
      supabase
        .from("instagram_account_insights")
        .select("metric, value, end_time, synced_at")
        .eq("social_account_id", account.id)
        .gte("end_time", fourteenDaysAgo),
    ]);

  if (mediaError || insightsError) {
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

  const accountPeriods = summarizeAccountPeriods(accountInsights ?? [], now);
  const mediaMetrics = new Map<string, Map<string, number>>();

  for (const insight of mediaInsights) {
    const metrics = mediaMetrics.get(insight.instagram_media_id) ?? new Map<string, number>();
    metrics.set(insight.metric, toNumber(insight.value));
    mediaMetrics.set(insight.instagram_media_id, metrics);
  }

  const rankedMedia = mediaRows
    .map((item) => ({
      item,
      views: mediaMetrics.get(item.id)?.get("views") ?? 0,
      reach: mediaMetrics.get(item.id)?.get("reach") ?? 0,
      interactions:
        mediaMetrics.get(item.id)?.get("total_interactions") ??
        (item.like_count ?? 0) + (item.comments_count ?? 0),
    }))
    .sort((a, b) => b.reach - a.reach || b.views - a.views);

  const priority = rankedMedia[0];
  const nextBestReach = rankedMedia[1]?.reach ?? 0;

  return {
    username: account.username,
    followers: account.followers_count ?? 0,
    sevenDayReach: accountPeriods.current.get("reach") ?? 0,
    sevenDayViews: accountPeriods.current.get("views") ?? 0,
    sevenDayInteractions: accountPeriods.current.get("total_interactions") ?? 0,
    previousSevenDayReach: accountPeriods.previous.get("reach") ?? 0,
    previousSevenDayViews: accountPeriods.previous.get("views") ?? 0,
    previousSevenDayInteractions: accountPeriods.previous.get("total_interactions") ?? 0,
    availableAccountMetrics: [...accountPeriods.available],
    syncedMediaCount: mediaRows.length,
    totalMediaInteractions: rankedMedia.reduce((total, item) => total + item.interactions, 0),
    lastSyncedAt: findLatestTimestamp([
      connection.connected_at,
      ...mediaRows.map((item) => item.synced_at),
      ...(accountInsights ?? []).map((item) => item.synced_at),
    ]),
    priority: priority
      ? {
          contentLabel: getContentLabel(priority.item),
          dateLabel: formatMediaDate(priority.item.posted_at),
          views: priority.views,
          reach: priority.reach,
          interactions: priority.interactions,
          reachMultiplier:
            nextBestReach > 0 && priority.reach > nextBestReach
              ? priority.reach / nextBestReach
              : null,
          runnerUpReach: nextBestReach,
          permalink: priority.item.permalink,
        }
      : null,
  };
}

function findLatestTimestamp(values: (string | null)[]) {
  const timestamps = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite);

  return timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : null;
}

function summarizeAccountPeriods(
  rows: { metric: string; value: number | string; end_time: string }[],
  now: Date,
) {
  const current = new Map<string, number>();
  const previous = new Map<string, number>();
  const available = new Set<string>();
  const currentBoundary = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const previousBoundary = now.getTime() - 14 * 24 * 60 * 60 * 1000;

  for (const row of rows) {
    const endTime = new Date(row.end_time).getTime();
    if (!Number.isFinite(endTime) || endTime < previousBoundary) continue;

    available.add(row.metric);
    const period = endTime >= currentBoundary ? current : previous;
    period.set(row.metric, (period.get(row.metric) ?? 0) + toNumber(row.value));
  }

  return { current, previous, available };
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
