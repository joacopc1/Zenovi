import "server-only";

import type {
  ContentComparisonFormat,
  ContentKind,
  ContentLibraryItem,
} from "@/lib/content/library";
import { createClient } from "@/lib/supabase/server";
import { readEmbeddedRow } from "./embedded-row";

type InstagramMediaRow = {
  id: string;
  caption: string | null;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_product_type: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  duration_ms: number | null;
  media_width: number | null;
  media_height: number | null;
  permalink: string | null;
  posted_at: string;
  like_count: number | null;
  comments_count: number | null;
  instagram_media_children: {
    position: number;
    media_type: "IMAGE" | "VIDEO";
    media_url: string | null;
    thumbnail_url: string | null;
  }[] | null;
};

type InstagramInsightRow = {
  instagram_media_id: string;
  metric: string;
  value: number | string;
};

export type InstagramContentLibrary = {
  username: string;
  items: ContentLibraryItem[];
};

export async function getInstagramContentLibrary(
  workspaceId: string,
): Promise<InstagramContentLibrary | null> {
  const supabase = await createClient();
  // La cuenta viene incrustada: eran dos viajes seguidos a la base para dos filas que
  // siempre se leen juntas.
  const { data: connection, error: connectionError } = await supabase
    .from("social_connections")
    .select("id, social_accounts(id, username)")
    .eq("workspace_id", workspaceId)
    .eq("provider", "instagram")
    .eq("status", "connected")
    .maybeSingle();

  if (connectionError) throw new Error("No pudimos cargar la conexión de Instagram.");
  if (!connection) return null;

  const account = readEmbeddedRow<{ id: string; username: string }>(connection.social_accounts);
  if (!account) return null;

  const { data: media, error: mediaError } = await supabase
    .from("instagram_media")
    .select(
      "id, caption, media_type, media_product_type, media_url, thumbnail_url, duration_ms, media_width, media_height, permalink, posted_at, like_count, comments_count, instagram_media_children(position, media_type, media_url, thumbnail_url)",
    )
    .eq("social_account_id", account.id)
    .order("posted_at", { ascending: false })
    .limit(100);

  if (mediaError) throw new Error("No pudimos cargar el contenido de Instagram.");

  const mediaRows = (media ?? []) as InstagramMediaRow[];
  const mediaIds = mediaRows.map((item) => item.id);
  let insights: InstagramInsightRow[] = [];

  if (mediaIds.length > 0) {
    const { data, error } = await supabase
      .from("instagram_media_insights")
      .select("instagram_media_id, metric, value")
      .in("instagram_media_id", mediaIds);

    if (error) throw new Error("No pudimos cargar las métricas del contenido.");
    insights = (data ?? []) as InstagramInsightRow[];
  }

  const metricsByMedia = new Map<string, Map<string, number>>();

  for (const insight of insights) {
    const metricValue = toMetricNumber(insight.value);
    if (metricValue === null) continue;

    const metrics = metricsByMedia.get(insight.instagram_media_id) ?? new Map<string, number>();
    metrics.set(insight.metric, metricValue);
    metricsByMedia.set(insight.instagram_media_id, metrics);
  }

  return {
    username: account.username,
    items: mediaRows.map((item) => mapContentItem(item, metricsByMedia.get(item.id))),
  };
}

function mapContentItem(
  item: InstagramMediaRow,
  metrics: Map<string, number> | undefined,
): ContentLibraryItem {
  return {
    id: item.id,
    kind: getContentKind(item),
    comparisonFormat: getComparisonFormat(item),
    formatLabel: getFormatLabel(item),
    caption: item.caption,
    thumbnailUrl: getThumbnailUrl(item),
    mediaUrl: item.media_url,
    mediaWidth: readDimension(item.media_width),
    mediaHeight: readDimension(item.media_height),
    slides: (item.instagram_media_children ?? [])
      .filter((slide) => slide.media_type === "IMAGE" || slide.media_type === "VIDEO")
      .sort((left, right) => left.position - right.position)
      .map((slide) => ({
        position: slide.position,
        mediaType: slide.media_type,
        mediaUrl: slide.media_url,
        thumbnailUrl: slide.thumbnail_url,
      })),
    durationMs: item.duration_ms,
    permalink: item.permalink,
    postedAt: item.posted_at,
    dateLabel: formatMediaDate(item.posted_at),
    relativeDateLabel: formatRelativeDate(item.posted_at),
    likes: metrics?.get("likes") ?? item.like_count,
    comments: metrics?.get("comments") ?? item.comments_count,
    views: metrics?.get("views") ?? null,
    reach: metrics?.get("reach") ?? null,
    interactions: metrics?.get("total_interactions") ?? null,
    saves: metrics?.get("saved") ?? null,
    shares: metrics?.get("shares") ?? null,
    follows: metrics?.get("follows") ?? null,
    profileVisits: metrics?.get("profile_visits") ?? null,
    profileActivity: metrics?.get("profile_activity") ?? null,
    averageWatchTimeMs: metrics?.get("ig_reels_avg_watch_time") ?? null,
    totalWatchTimeMs: metrics?.get("ig_reels_video_view_total_time") ?? null,
    skipRate: metrics?.get("reels_skip_rate") ?? null,
  };
}

function readDimension(value: number | null) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

function getComparisonFormat(item: InstagramMediaRow): ContentComparisonFormat {
  const kind = getContentKind(item);
  if (kind === "reel" || kind === "story") return kind;
  if (item.media_type === "CAROUSEL_ALBUM") return "carousel";
  if (item.media_type === "VIDEO") return "video";
  return "image";
}

function getContentKind(item: InstagramMediaRow): ContentKind {
  const productType = item.media_product_type?.toUpperCase();
  if (productType === "REELS") return "reel";
  if (productType === "STORY") return "story";
  return "publication";
}

function getFormatLabel(item: InstagramMediaRow) {
  const kind = getContentKind(item);
  if (kind === "reel") return "Reel";
  if (kind === "story") return "Historia";
  if (item.media_type === "CAROUSEL_ALBUM") return "Carrusel";
  if (item.media_type === "VIDEO") return "Video";
  return "Publicación";
}

function getThumbnailUrl(item: InstagramMediaRow) {
  if (item.thumbnail_url) return item.thumbnail_url;
  return item.media_type === "VIDEO" ? null : item.media_url;
}

function formatMediaDate(value: string) {
  return new Intl.DateTimeFormat("es-UY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Montevideo",
  }).format(new Date(value));
}

function formatRelativeDate(value: string) {
  const elapsedDays = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / (24 * 60 * 60 * 1000)),
  );

  if (elapsedDays === 0) return "Hoy";
  if (elapsedDays === 1) return "Ayer";
  if (elapsedDays < 30) return `Hace ${elapsedDays} días`;

  const months = Math.floor(elapsedDays / 30);
  if (months < 12) return `Hace ${months} ${months === 1 ? "mes" : "meses"}`;

  const years = Math.floor(months / 12);
  return `Hace ${years} ${years === 1 ? "año" : "años"}`;
}

function toMetricNumber(value: number | string) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
