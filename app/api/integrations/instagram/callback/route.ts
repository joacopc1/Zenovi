import { NextResponse, type NextRequest } from "next/server";
import {
  exchangeInstagramAuthorizationCode,
  exchangeInstagramLongLivedToken,
  getInstagramAccountProfile,
} from "@/lib/meta/api";
import { getInstagramOAuthConfig } from "@/lib/meta/config";
import { digestInstagramOAuthState } from "@/lib/meta/oauth";
import { syncInstagramConnection } from "@/lib/meta/sync";
import { encryptMetaToken } from "@/lib/meta/token-crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const DEFAULT_REDIRECT_PATH = "/onboarding/instagram";
const OAUTH_STATE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const MAX_AUTHORIZATION_CODE_LENGTH = 4096;

type AdminClient = ReturnType<typeof createAdminClient>;
type OAuthAttempt = {
  id: string;
  workspace_id: string;
  redirect_path: string;
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const state = request.nextUrl.searchParams.get("state") ?? "";

  if (!OAUTH_STATE_PATTERN.test(state)) {
    return redirectWithError(request, DEFAULT_REDIRECT_PATH, "invalid_callback");
  }

  let config;

  try {
    config = getInstagramOAuthConfig();
  } catch {
    return redirectWithError(request, DEFAULT_REDIRECT_PATH, "configuration_unavailable");
  }

  const admin = createAdminClient();
  const callbackDenied = request.nextUrl.searchParams.has("error");
  const { attempt, error: attemptError } = await consumeOAuthAttempt(
    admin,
    authData.user.id,
    state,
    callbackDenied ? "authorization_denied" : null,
  );

  if (attemptError || !attempt) {
    return redirectWithError(request, DEFAULT_REDIRECT_PATH, "invalid_or_expired_attempt");
  }

  const { data: connection, error: connectionError } = await admin
    .from("social_connections")
    .select("id")
    .eq("workspace_id", attempt.workspace_id)
    .eq("provider", "instagram")
    .maybeSingle();

  if (connectionError || !connection) {
    return redirectWithError(request, attempt.redirect_path, "connection_unavailable");
  }

  if (callbackDenied) {
    await markConnectionFailure(admin, attempt, "authorization_denied", "action_required");
    return redirectWithError(request, attempt.redirect_path, "authorization_denied");
  }

  const code = request.nextUrl.searchParams.get("code")?.trim() ?? "";

  if (!code || code.length > MAX_AUTHORIZATION_CODE_LENGTH) {
    await markConnectionFailure(admin, attempt, "missing_authorization_code", "failed");
    return redirectWithError(request, attempt.redirect_path, "invalid_callback");
  }

  if (!(await setConnectionStatus(admin, attempt.workspace_id, "meta_authorized"))) {
    return redirectWithError(request, attempt.redirect_path, "connection_unavailable");
  }

  if (!(await setConnectionStatus(admin, attempt.workspace_id, "callback_validated"))) {
    return redirectWithError(request, attempt.redirect_path, "connection_unavailable");
  }

  const shortToken = await exchangeInstagramAuthorizationCode(config, code);

  if (!shortToken.ok) {
    await markConnectionFailure(admin, attempt, "token_exchange_failed", "failed");
    return redirectWithError(request, attempt.redirect_path, "token_exchange_failed");
  }

  const longToken = await exchangeInstagramLongLivedToken(config, shortToken.data.accessToken);

  if (!longToken.ok) {
    await markConnectionFailure(admin, attempt, "long_token_exchange_failed", "failed");
    return redirectWithError(request, attempt.redirect_path, "token_exchange_failed");
  }

  if (!(await setConnectionStatus(admin, attempt.workspace_id, "token_verified"))) {
    return redirectWithError(request, attempt.redirect_path, "connection_unavailable");
  }

  const profile = await getInstagramAccountProfile(longToken.data.accessToken);

  if (!profile.ok) {
    const isIncompatible = profile.code === "incompatible_account";
    await markConnectionFailure(
      admin,
      attempt,
      isIncompatible ? "incompatible_account" : "account_lookup_failed",
      isIncompatible ? "action_required" : "failed",
    );
    return redirectWithError(
      request,
      attempt.redirect_path,
      isIncompatible ? "incompatible_account" : "account_lookup_failed",
    );
  }

  const encryptedToken = encryptMetaToken(longToken.data.accessToken);
  const { data: socialAccount, error: accountError } = await admin
    .from("social_accounts")
    .upsert(
      {
        connection_id: connection.id,
        provider: "instagram",
        provider_account_id: profile.data.id,
        username: profile.data.username,
        account_type: profile.data.accountType,
        profile_picture_url: profile.data.profilePictureUrl,
        followers_count: profile.data.followersCount,
        follows_count: profile.data.followsCount,
        media_count: profile.data.mediaCount,
      },
      { onConflict: "connection_id" },
    )
    .select("id, provider_account_id")
    .single();

  if (accountError || !socialAccount) {
    await markConnectionFailure(admin, attempt, "account_persistence_failed", "failed");
    return redirectWithError(request, attempt.redirect_path, "account_unavailable");
  }

  const { error: credentialError } = await admin.from("instagram_connection_credentials").upsert({
    connection_id: connection.id,
    access_token_ciphertext: encryptedToken.ciphertext,
    access_token_iv: encryptedToken.iv,
    access_token_auth_tag: encryptedToken.authTag,
    encryption_key_version: encryptedToken.keyVersion,
    expires_at: longToken.data.expiresAt,
  });

  if (credentialError) {
    await markConnectionFailure(admin, attempt, "credential_persistence_failed", "failed");
    return redirectWithError(request, attempt.redirect_path, "connection_unavailable");
  }

  if (!(await setConnectionStatus(admin, attempt.workspace_id, "account_resolved"))) {
    await markConnectionFailure(admin, attempt, "connection_finalize_failed", "failed");
    return redirectWithError(request, attempt.redirect_path, "connection_unavailable");
  }

  if (!(await setConnectionStatus(admin, attempt.workspace_id, "initial_sync_queued"))) {
    await markConnectionFailure(admin, attempt, "sync_queue_failed", "failed");
    return redirectWithError(request, attempt.redirect_path, "initial_sync_failed");
  }

  const syncResult = await syncInstagramConnection({
    admin,
    connectionId: connection.id,
    socialAccountId: socialAccount.id,
    providerAccountId: socialAccount.provider_account_id,
    accessToken: longToken.data.accessToken,
  });

  if (!syncResult.ok) {
    return redirectWithError(request, attempt.redirect_path, "initial_sync_failed");
  }

  const destination = new URL(attempt.redirect_path, request.url);
  destination.searchParams.set("connected", "1");
  return NextResponse.redirect(destination);
}

async function consumeOAuthAttempt(
  admin: AdminClient,
  userId: string,
  state: string,
  failureCode: string | null,
) {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("instagram_oauth_attempts")
    .update({ consumed_at: now, failure_code: failureCode })
    .eq("user_id", userId)
    .eq("provider", "instagram")
    .eq("state_digest", digestInstagramOAuthState(state))
    .is("consumed_at", null)
    .gt("expires_at", now)
    .select("id, workspace_id, redirect_path")
    .maybeSingle();

  return { attempt: data as OAuthAttempt | null, error };
}

async function setConnectionStatus(admin: AdminClient, workspaceId: string, status: string) {
  const { error } = await admin
    .from("social_connections")
    .update({ status, last_error_code: null, last_error_at: null })
    .eq("workspace_id", workspaceId)
    .eq("provider", "instagram");

  return !error;
}

async function markConnectionFailure(
  admin: AdminClient,
  attempt: OAuthAttempt,
  code: string,
  status: "action_required" | "failed",
) {
  const timestamp = new Date().toISOString();
  const [attemptResult, connectionResult] = await Promise.all([
    admin.from("instagram_oauth_attempts").update({ failure_code: code }).eq("id", attempt.id),
    admin
      .from("social_connections")
      .update({ status, last_error_code: code, last_error_at: timestamp })
      .eq("workspace_id", attempt.workspace_id)
      .eq("provider", "instagram"),
  ]);

  return !attemptResult.error && !connectionResult.error;
}

function redirectWithError(request: NextRequest, path: string, code: string) {
  const destination = new URL(path, request.url);
  destination.searchParams.set("error", code);
  return NextResponse.redirect(destination);
}
