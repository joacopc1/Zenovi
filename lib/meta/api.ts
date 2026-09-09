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

export async function exchangeInstagramAuthorizationCode(
  config: InstagramOAuthConfig,
  code: string,
): Promise<MetaResult<{ accessToken: string; userId: string }>> {
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
  const userId = readIdentifier(response.data, "user_id");

  if (!accessToken || !userId) {
    return { ok: false, code: "invalid_short_token_response" };
  }

  return { ok: true, data: { accessToken, userId } };
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
  userId: string,
  accessToken: string,
): Promise<MetaResult<InstagramAccountProfile>> {
  const url = new URL(`/${INSTAGRAM_GRAPH_VERSION}/${encodeURIComponent(userId)}`, INSTAGRAM_GRAPH_ORIGIN);
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

  const id = readIdentifier(response.data, "id") ?? userId;
  const username = readNonEmptyString(response.data, "username");
  const accountType = readNonEmptyString(response.data, "account_type");

  if (!username || (accountType !== "BUSINESS" && accountType !== "MEDIA_CREATOR")) {
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
