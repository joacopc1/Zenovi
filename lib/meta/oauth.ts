import "server-only";

import { createHash, randomBytes } from "node:crypto";

const INSTAGRAM_AUTHORIZATION_ENDPOINT = "https://www.instagram.com/oauth/authorize";

export const INSTAGRAM_OAUTH_SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_insights",
] as const;

export function createInstagramOAuthState() {
  const state = randomBytes(32).toString("base64url");

  return {
    state,
    stateDigest: digestInstagramOAuthState(state),
  };
}

export function digestInstagramOAuthState(state: string) {
  return `\\x${createHash("sha256").update(state, "utf8").digest("hex")}`;
}

export function buildInstagramAuthorizationUrl({
  appId,
  redirectUri,
  state,
}: {
  appId: string;
  redirectUri: string;
  state: string;
}) {
  const url = new URL(INSTAGRAM_AUTHORIZATION_ENDPOINT);

  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", INSTAGRAM_OAUTH_SCOPES.join(","));
  url.searchParams.set("state", state);

  return url;
}
