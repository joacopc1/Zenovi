import "server-only";

import { mapWithConcurrency } from "@/lib/async/map-with-concurrency";
import type { InstagramOAuthConfig } from "@/lib/meta/config";
import {
  buildAccountInsightWindows,
  type InsightWindow,
} from "@/lib/meta/insight-periods";
import type { BackfillRequest } from "@/lib/meta/daily-backfill";
import {
  MAX_MEDIA_ITEMS,
  MEDIA_PAGE_SIZE,
  needsMoreMedia,
  readNextCursor,
} from "@/lib/meta/media-sync-plan";
import type { PeriodWindow } from "@/lib/data/period-breakdowns";
import {
  DEMOGRAPHICS_METRIC,
  DEMOGRAPHIC_DIMENSIONS,
  type DemographicDimension,
} from "@/lib/data/follower-demographics";

const INSTAGRAM_TOKEN_ENDPOINT = "https://api.instagram.com/oauth/access_token";
const INSTAGRAM_GRAPH_ORIGIN = "https://graph.instagram.com";
const INSTAGRAM_GRAPH_VERSION = "v26.0";
const META_REQUEST_TIMEOUT_MS = 12_000;
const COMMON_MEDIA_INSIGHT_METRICS = [
  "views",
  "reach",
  "likes",
  "comments",
  "shares",
  "saved",
  "total_interactions",
] as const;
const REEL_INSIGHT_METRICS = [
  "ig_reels_video_view_total_time",
  "ig_reels_avg_watch_time",
  "reels_skip_rate",
] as const;
/**
 * Métricas que Meta entrega como serie diaria real.
 *
 * Sólo `reach`: se comprobó que `views` y `total_interactions` no devuelven histórico
 * por esta vía, así que se reconstruyen día por día en el backfill (`daily-backfill`).
 */
const ACCOUNT_DAILY_METRICS = ["reach"] as const;
const ACCOUNT_TOTAL_METRICS = [
  "views",
  "reach",
  "profile_views",
  "accounts_engaged",
  "total_interactions",
  "profile_links_taps",
] as const;
const ACCOUNT_INSIGHT_CONCURRENCY = 3;

type MetaResult<T> = { ok: true; data: T } | { ok: false; code: string };

export type InstagramAccountProfile = {
  id: string;
  username: string;
  accountType: "BUSINESS" | "MEDIA_CREATOR";
  profilePictureUrl: string | null;
  followersCount: number | null;
  followsCount: number | null;
  mediaCount: number | null;
};

export type InstagramMedia = {
  id: string;
  caption: string | null;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  mediaProductType: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  permalink: string | null;
  timestamp: string;
  likeCount: number | null;
  commentsCount: number | null;
};

export type InstagramInsight = {
  metric: string;
  period: string;
  value: number;
  endTime: string | null;
};

export type InstagramAccountMetricSummary = {
  metric: (typeof ACCOUNT_TOTAL_METRICS)[number];
  currentValue: number;
  previousValue: number | null;
  currentEnd: string;
  previousEnd: string;
};

export type InstagramAccountInsights = {
  daily: InstagramInsight[];
  summaries: InstagramAccountMetricSummary[];
};

export async function exchangeInstagramAuthorizationCode(
  config: InstagramOAuthConfig,
  code: string,
): Promise<MetaResult<{ accessToken: string }>> {
  const body = new FormData();
  body.set("client_id", config.appId);
  body.set("client_secret", config.appSecret);
  body.set("grant_type", "authorization_code");
  body.set("redirect_uri", config.redirectUri);
  body.set("code", code);

  const response = await requestMeta(INSTAGRAM_TOKEN_ENDPOINT, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    return response;
  }

  const accessToken = readNonEmptyString(response.data, "access_token");

  if (!accessToken) {
    return { ok: false, code: "invalid_short_token_response" };
  }

  return { ok: true, data: { accessToken } };
}

export async function exchangeInstagramLongLivedToken(
  config: InstagramOAuthConfig,
  shortLivedToken: string,
): Promise<MetaResult<{ accessToken: string; expiresAt: string | null }>> {
  const url = new URL("/access_token", INSTAGRAM_GRAPH_ORIGIN);
  url.searchParams.set("grant_type", "ig_exchange_token");
  url.searchParams.set("client_secret", config.appSecret);
  url.searchParams.set("access_token", shortLivedToken);

  const response = await requestMeta(url);

  if (!response.ok) {
    return response;
  }

  const accessToken = readNonEmptyString(response.data, "access_token");
  const expiresIn = readNonNegativeNumber(response.data, "expires_in");

  if (!accessToken) {
    return { ok: false, code: "invalid_long_token_response" };
  }

  return {
    ok: true,
    data: {
      accessToken,
      expiresAt: expiresIn === null ? null : new Date(Date.now() + expiresIn * 1000).toISOString(),
    },
  };
}

/**
 * Renueva un token de larga duración por otros 60 días. Meta sólo lo acepta si tiene al
 * menos 24 horas y no venció; la decisión de cuándo pedirlo está en `token-refresh`.
 */
export async function refreshInstagramLongLivedToken(
  accessToken: string,
): Promise<MetaResult<{ accessToken: string; expiresAt: string | null }>> {
  const url = new URL("/refresh_access_token", INSTAGRAM_GRAPH_ORIGIN);
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", accessToken);

  const response = await requestMeta(url);

  if (!response.ok) {
    return response;
  }

  const refreshedToken = readNonEmptyString(response.data, "access_token");
  const expiresIn = readNonNegativeNumber(response.data, "expires_in");

  if (!refreshedToken) {
    return { ok: false, code: "invalid_refresh_token_response" };
  }

  return {
    ok: true,
    data: {
      accessToken: refreshedToken,
      expiresAt: expiresIn === null ? null : new Date(Date.now() + expiresIn * 1000).toISOString(),
    },
  };
}

export async function getInstagramAccountProfile(
  accessToken: string,
): Promise<MetaResult<InstagramAccountProfile>> {
  const url = new URL(`/${INSTAGRAM_GRAPH_VERSION}/me`, INSTAGRAM_GRAPH_ORIGIN);
  url.searchParams.set(
    "fields",
    "id,username,account_type,profile_picture_url,followers_count,follows_count,media_count",
  );

  const response = await requestMeta(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    return response;
  }

  const id = readIdentifier(response.data, "id");
  const username = readNonEmptyString(response.data, "username");
  const accountType = readNonEmptyString(response.data, "account_type");

  if (!id || !username || (accountType !== "BUSINESS" && accountType !== "MEDIA_CREATOR")) {
    return { ok: false, code: "incompatible_account" };
  }

  return {
    ok: true,
    data: {
      id,
      username,
      accountType,
      profilePictureUrl: readNonEmptyString(response.data, "profile_picture_url"),
      followersCount: readNonNegativeNumber(response.data, "followers_count"),
      followsCount: readNonNegativeNumber(response.data, "follows_count"),
      mediaCount: readNonNegativeNumber(response.data, "media_count"),
    },
  };
}

/**
 * Contenido reciente de la cuenta, página por página, hasta donde indica `needsMoreMedia`.
 *
 * Cada página se arma con el cursor en vez de seguir la URL `next` de la respuesta, y el
 * token viaja sólo en el encabezado. Si falla una página posterior a la primera se
 * devuelve lo ya traído: esas piezas son válidas y las anteriores siguen guardadas.
 */
export async function getInstagramMedia(
  accessToken: string,
): Promise<MetaResult<InstagramMedia[]>> {
  const media: InstagramMedia[] = [];
  const seenCursors = new Set<string>();
  let after: string | null = null;

  for (let page = 0; page < Math.ceil(MAX_MEDIA_ITEMS / MEDIA_PAGE_SIZE); page += 1) {
    const url = new URL(`/${INSTAGRAM_GRAPH_VERSION}/me/media`, INSTAGRAM_GRAPH_ORIGIN);
    url.searchParams.set(
      "fields",
      "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
    );
    url.searchParams.set("limit", String(MEDIA_PAGE_SIZE));
    if (after) url.searchParams.set("after", after);

    const response = await requestMeta(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) return page === 0 ? response : { ok: true, data: media };

    const data = Array.isArray(response.data.data) ? response.data.data : null;
    if (!data) {
      return page === 0 ? { ok: false, code: "invalid_media_response" } : { ok: true, data: media };
    }

    media.push(...data.map(parseInstagramMedia).filter((item) => item !== null));

    // Un cursor repetido cortaría un bucle infinito si Meta devolviera la misma página.
    const next = readNextCursor(response.data);
    const more = needsMoreMedia({
      fetchedCount: media.length,
      oldestPostedAt: media.at(-1)?.timestamp ?? null,
      now: new Date(),
    });
    if (!next || seenCursors.has(next) || !more) break;
    seenCursors.add(next);
    after = next;
  }

  return { ok: true, data: media.slice(0, MAX_MEDIA_ITEMS) };
}

export async function getInstagramMediaInsights(
  mediaId: string,
  accessToken: string,
  mediaProductType: string | null,
): Promise<MetaResult<InstagramInsight[]>> {
  const url = new URL(
    `/${INSTAGRAM_GRAPH_VERSION}/${encodeURIComponent(mediaId)}/insights`,
    INSTAGRAM_GRAPH_ORIGIN,
  );
  url.searchParams.set(
    "metric",
    [
      ...COMMON_MEDIA_INSIGHT_METRICS,
      ...(mediaProductType === "REELS" ? REEL_INSIGHT_METRICS : []),
    ].join(","),
  );

  const response = await requestMeta(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return response.ok ? parseInstagramInsights(response.data) : response;
}

export async function getInstagramAccountInsights(
  accountId: string,
  accessToken: string,
): Promise<MetaResult<InstagramAccountInsights>> {
  const windows = buildAccountInsightWindows();
  const [dailyChunkResults, summaryResults] = await Promise.all([
    // Cada métrica se pide por tramos de 30 días; ni un tramo ni una métrica
    // caída invalidan a las demás.
    mapWithConcurrency(
      ACCOUNT_DAILY_METRICS.flatMap((metric) =>
        windows.dailyChunks.map((chunk) => ({ metric, chunk })),
      ),
      ACCOUNT_INSIGHT_CONCURRENCY,
      ({ metric, chunk }) =>
        requestInstagramAccountMetric(accountId, accessToken, metric, chunk),
    ),
    mapWithConcurrency(
      ACCOUNT_TOTAL_METRICS,
      ACCOUNT_INSIGHT_CONCURRENCY,
      async (metric) => {
        const [current, previous] = await Promise.all([
          requestInstagramAccountMetric(accountId, accessToken, metric, windows.current, true),
          requestInstagramAccountMetric(accountId, accessToken, metric, windows.previous, true),
        ]);

        return { metric, current, previous };
      },
    ),
  ]);

  const summaries = summaryResults.flatMap(({ metric, current, previous }) => {
    if (!current.ok || !previous.ok) return [];

    const currentValue = readTotalInsight(current.data, metric);
    const previousValue = readTotalInsight(previous.data, metric);

    return currentValue === null
      ? []
      : [{
          metric,
          currentValue,
          previousValue,
          currentEnd: windows.current.end,
          previousEnd: windows.previous.end,
        }];
  });

  const daily = dailyChunkResults.flatMap((result) => (result.ok ? result.data : []));
  const failedChunk = dailyChunkResults.find((result) => !result.ok);

  // Sólo se abandona si no se pudo rescatar nada: ni un tramo de la serie ni un total.
  if (daily.length === 0 && summaries.length === 0 && failedChunk) return failedChunk;

  return { ok: true, data: { daily, summaries } };
}

/**
 * Pide el total de una métrica para cada ventana de un día.
 *
 * Verificado contra la serie diaria real de `reach`: el total de una ventana de un
 * día coincide con el valor que Meta informa para ese día, así que sirve para
 * reconstruir el histórico de las métricas que no tienen serie propia.
 */
export async function getInstagramDailyTotals(
  accountId: string,
  accessToken: string,
  requests: readonly BackfillRequest[],
): Promise<{ metric: string; endTime: string; value: number }[]> {
  const results = await mapWithConcurrency(
    requests,
    ACCOUNT_INSIGHT_CONCURRENCY,
    async ({ metric, window }) => {
      const result = await requestInstagramAccountMetric(
        accountId,
        accessToken,
        metric,
        window,
        true,
      );
      if (!result.ok) return null;

      const value = readTotalInsight(result.data, metric);
      return value === null ? null : { metric, endTime: window.end, value };
    },
  );

  return results.filter((entry) => entry !== null);
}

/**
 * Totales de período que sólo Meta puede calcular: alcance (cuentas únicas) y los
 * desgloses de visualizaciones por tipo de contenido y por seguidores. Se verificaron
 * contra el panel profesional de Instagram y coinciden.
 */
const PERIOD_QUERIES = [
  { metric: "reach", breakdown: null },
  { metric: "views", breakdown: "media_product_type" },
  { metric: "views", breakdown: "follow_type" },
] as const;

export type InstagramPeriodInsight = {
  metric: string;
  windowDays: PeriodWindow["days"];
  end: string;
  value: number;
  dimension: string | null;
  dimensionValue: string | null;
};

export async function getInstagramPeriodInsights(
  accountId: string,
  accessToken: string,
  windows: readonly PeriodWindow[],
): Promise<InstagramPeriodInsight[]> {
  const requests = windows.flatMap((window) => PERIOD_QUERIES.map((query) => ({ window, query })));
  const results = await mapWithConcurrency(
    requests,
    ACCOUNT_INSIGHT_CONCURRENCY,
    async ({ window, query }) => {
      const url = new URL(
        `/${INSTAGRAM_GRAPH_VERSION}/${encodeURIComponent(accountId)}/insights`,
        INSTAGRAM_GRAPH_ORIGIN,
      );
      url.searchParams.set("metric", query.metric);
      url.searchParams.set("period", "day");
      url.searchParams.set("metric_type", "total_value");
      url.searchParams.set("since", String(window.since));
      url.searchParams.set("until", String(window.until));
      if (query.breakdown) url.searchParams.set("breakdown", query.breakdown);

      const response = await requestMeta(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return response.ok ? readPeriodInsight(response.data, query, window) : [];
    },
  );

  return results.flat();
}

function readPeriodInsight(
  data: Record<string, unknown>,
  query: (typeof PERIOD_QUERIES)[number],
  window: PeriodWindow,
): InstagramPeriodInsight[] {
  const items = Array.isArray(data.data) ? data.data : [];
  const item = items.find((candidate) => isRecord(candidate) && candidate.name === query.metric);
  if (!isRecord(item) || !isRecord(item.total_value)) return [];

  const base = { metric: query.metric, windowDays: window.days, end: window.end };

  if (!query.breakdown) {
    const value = readNonNegativeNumber(item.total_value, "value");
    return value === null ? [] : [{ ...base, value, dimension: null, dimensionValue: null }];
  }

  const breakdowns = Array.isArray(item.total_value.breakdowns) ? item.total_value.breakdowns : [];
  const results = isRecord(breakdowns[0]) && Array.isArray(breakdowns[0].results) ? breakdowns[0].results : [];

  return results.flatMap((result) => {
    if (!isRecord(result) || !Array.isArray(result.dimension_values)) return [];
    const dimensionValue = result.dimension_values[0];
    const value = readNonNegativeNumber(result, "value");

    return typeof dimensionValue === "string" && value !== null
      ? [{ ...base, value, dimension: query.breakdown, dimensionValue }]
      : [];
  });
}

async function requestInstagramAccountMetric(
  accountId: string,
  accessToken: string,
  metric: string,
  window: InsightWindow,
  totalValue = false,
): Promise<MetaResult<InstagramInsight[]>> {
  const url = new URL(
    `/${INSTAGRAM_GRAPH_VERSION}/${encodeURIComponent(accountId)}/insights`,
    INSTAGRAM_GRAPH_ORIGIN,
  );
  url.searchParams.set("metric", metric);
  url.searchParams.set("period", "day");
  url.searchParams.set("since", String(window.since));
  url.searchParams.set("until", String(window.until));
  if (totalValue) url.searchParams.set("metric_type", "total_value");

  const response = await requestMeta(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return response.ok ? parseInstagramInsights(response.data) : response;
}

function readTotalInsight(insights: InstagramInsight[], metric: string) {
  return insights.find((insight) => insight.metric === metric && insight.endTime === null)?.value ?? null;
}

function parseInstagramMedia(value: unknown): InstagramMedia | null {
  if (!isRecord(value)) return null;

  const id = readIdentifier(value, "id");
  const mediaType = readNonEmptyString(value, "media_type");
  const timestamp = readNonEmptyString(value, "timestamp");

  if (
    !id ||
    !timestamp ||
    (mediaType !== "IMAGE" && mediaType !== "VIDEO" && mediaType !== "CAROUSEL_ALBUM")
  ) {
    return null;
  }

  return {
    id,
    caption: readNonEmptyString(value, "caption"),
    mediaType,
    mediaProductType: readNonEmptyString(value, "media_product_type"),
    mediaUrl: readNonEmptyString(value, "media_url"),
    thumbnailUrl: readNonEmptyString(value, "thumbnail_url"),
    permalink: readNonEmptyString(value, "permalink"),
    timestamp,
    likeCount: readNonNegativeNumber(value, "like_count"),
    commentsCount: readNonNegativeNumber(value, "comments_count"),
  };
}

function parseInstagramInsights(
  payload: Record<string, unknown>,
): MetaResult<InstagramInsight[]> {
  if (!Array.isArray(payload.data)) {
    return { ok: false, code: "invalid_insights_response" };
  }

  const insights: InstagramInsight[] = [];

  for (const item of payload.data) {
    if (!isRecord(item)) continue;

    const metric = readNonEmptyString(item, "name");
    const period = readNonEmptyString(item, "period") ?? "lifetime";

    if (!metric) continue;

    if (Array.isArray(item.values)) {
      for (const point of item.values) {
        if (!isRecord(point)) continue;
        const value = readNonNegativeNumber(point, "value");
        if (value === null) continue;

        insights.push({
          metric,
          period,
          value,
          endTime: readNonEmptyString(point, "end_time"),
        });
      }
    }

    if (isRecord(item.total_value)) {
      const value = readNonNegativeNumber(item.total_value, "value");
      if (value !== null) {
        insights.push({ metric, period, value, endTime: null });
      }
    }
  }

  return { ok: true, data: insights };
}

async function requestMeta(input: string | URL, init: RequestInit = {}): Promise<MetaResult<Record<string, unknown>>> {
  try {
    const response = await fetch(input, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(META_REQUEST_TIMEOUT_MS),
    });
    const payload = await readJsonObject(response);

    if (!response.ok || !payload) {
      return { ok: false, code: `meta_http_${response.status}` };
    }

    return { ok: true, data: payload };
  } catch {
    return { ok: false, code: "meta_request_failed" };
  }
}

async function readJsonObject(response: Response) {
  try {
    const value: unknown = await response.json();
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}

function readNonEmptyString(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readIdentifier(source: Record<string, unknown>, key: string) {
  const value = source[key];

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return value;
  }

  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
    return String(value);
  }

  return null;
}

function readNonNegativeNumber(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Quiénes siguen a la cuenta, por edad, género, país y ciudad.
 *
 * Comprobado contra una cuenta real: el parámetro es `breakdown` en singular —con
 * `breakdowns` Meta responde un conjunto vacío—, `timeframe` es obligatorio pero no
 * cambia el resultado (es una foto de los seguidores de hoy, no del período), y las
 * listas de país y ciudad vienen recortadas a los 45 valores más grandes.
 *
 * Una cuenta con menos de 100 seguidores no recibe nada: Meta responde sin datos.
 */
export async function getInstagramFollowerDemographics(
  accountId: string,
  accessToken: string,
): Promise<{ dimension: DemographicDimension; value: string; count: number }[]> {
  const results = await mapWithConcurrency(
    [...DEMOGRAPHIC_DIMENSIONS],
    ACCOUNT_INSIGHT_CONCURRENCY,
    async (dimension) => {
      const url = new URL(
        `/${INSTAGRAM_GRAPH_VERSION}/${encodeURIComponent(accountId)}/insights`,
        INSTAGRAM_GRAPH_ORIGIN,
      );
      url.searchParams.set("metric", DEMOGRAPHICS_METRIC);
      url.searchParams.set("period", "lifetime");
      url.searchParams.set("metric_type", "total_value");
      url.searchParams.set("timeframe", "last_90_days");
      url.searchParams.set("breakdown", dimension);

      const response = await requestMeta(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return response.ok ? readDemographics(response.data, dimension) : [];
    },
  );

  return results.flat();
}

function readDemographics(data: Record<string, unknown>, dimension: DemographicDimension) {
  const entries = Array.isArray(data.data) ? data.data : [];
  const item = entries.find((entry) => isRecord(entry) && entry.name === DEMOGRAPHICS_METRIC);
  if (!isRecord(item) || !isRecord(item.total_value)) return [];

  const breakdowns = Array.isArray(item.total_value.breakdowns) ? item.total_value.breakdowns : [];
  const results = isRecord(breakdowns[0]) && Array.isArray(breakdowns[0].results) ? breakdowns[0].results : [];

  return results.flatMap((result) => {
    if (!isRecord(result)) return [];
    const value = readNonNegativeNumber(result, "value");
    const dimensionValue = Array.isArray(result.dimension_values)
      ? result.dimension_values.at(-1)
      : null;

    return value === null || typeof dimensionValue !== "string" || dimensionValue.length === 0
      ? []
      : [{ dimension, value: dimensionValue, count: value }];
  });
}
