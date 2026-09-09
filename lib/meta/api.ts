import "server-only";

import type { InstagramOAuthConfig } from "@/lib/meta/config";

const INSTAGRAM_TOKEN_ENDPOINT = "https://api.instagram.com/oauth/access_token";
const INSTAGRAM_GRAPH_ORIGIN = "https://graph.instagram.com";
const INSTAGRAM_GRAPH_VERSION = "v26.0";
const META_REQUEST_TIMEOUT_MS = 12_000;

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

export async function getInstagramMedia(
  accessToken: string,
): Promise<MetaResult<InstagramMedia[]>> {
  const url = new URL(`/${INSTAGRAM_GRAPH_VERSION}/me/media`, INSTAGRAM_GRAPH_ORIGIN);
  url.searchParams.set(
    "fields",
    "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
  );
  url.searchParams.set("limit", "50");

  const response = await requestMeta(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) return response;

  const data = Array.isArray(response.data.data) ? response.data.data : null;

  if (!data) {
    return { ok: false, code: "invalid_media_response" };
  }

  const media = data.map(parseInstagramMedia).filter((item) => item !== null);
  return { ok: true, data: media };
}

export async function getInstagramMediaInsights(
  mediaId: string,
  accessToken: string,
): Promise<MetaResult<InstagramInsight[]>> {
  const url = new URL(
    `/${INSTAGRAM_GRAPH_VERSION}/${encodeURIComponent(mediaId)}/insights`,
    INSTAGRAM_GRAPH_ORIGIN,
  );
  url.searchParams.set("metric", "views,reach,total_interactions,shares,saved");

  const response = await requestMeta(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return response.ok ? parseInstagramInsights(response.data) : response;
}

export async function getInstagramAccountInsights(
  accountId: string,
  accessToken: string,
): Promise<MetaResult<InstagramInsight[]>> {
  const now = Math.floor(Date.now() / 1000);
  const sevenDaysAgo = now - 7 * 24 * 60 * 60;
  const url = new URL(
    `/${INSTAGRAM_GRAPH_VERSION}/${encodeURIComponent(accountId)}/insights`,
    INSTAGRAM_GRAPH_ORIGIN,
  );
  url.searchParams.set("metric", "views,reach,total_interactions");
  url.searchParams.set("period", "day");
  url.searchParams.set("since", String(sevenDaysAgo));
  url.searchParams.set("until", String(now));

  const response = await requestMeta(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return response.ok ? parseInstagramInsights(response.data) : response;
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
