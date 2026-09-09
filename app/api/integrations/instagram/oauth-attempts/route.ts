import { NextResponse, type NextRequest } from "next/server";
import { getInstagramOAuthConfig } from "@/lib/meta/config";
import { buildInstagramAuthorizationUrl, createInstagramOAuthState } from "@/lib/meta/oauth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ONBOARDING_PATH = "/onboarding/instagram";
const ATTEMPT_LIFETIME_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) {
    return new Response("Origen no permitido.", { status: 403 });
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("created_by", authData.user.id)
    .maybeSingle();

  if (workspaceError) {
    return redirectWithError(request, "workspace_unavailable");
  }

  if (!workspace) {
    return NextResponse.redirect(new URL("/onboarding/workspace", request.url), 303);
  }

  try {
    const oauthConfig = getInstagramOAuthConfig();
    const admin = createAdminClient();
    const { state, stateDigest } = createInstagramOAuthState();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ATTEMPT_LIFETIME_MS);

    const { error: cleanupError } = await admin
      .from("instagram_oauth_attempts")
      .delete()
      .eq("workspace_id", workspace.id)
      .eq("user_id", authData.user.id)
      .is("consumed_at", null)
      .lt("expires_at", now.toISOString());

    if (cleanupError) {
      return redirectWithError(request, "attempt_unavailable");
    }

    const { data: attempt, error: attemptError } = await admin
      .from("instagram_oauth_attempts")
      .insert({
        workspace_id: workspace.id,
        user_id: authData.user.id,
        state_digest: stateDigest,
        expires_at: expiresAt.toISOString(),
        redirect_path: ONBOARDING_PATH,
      })
      .select("id")
      .single();

    if (attemptError || !attempt) {
      return redirectWithError(request, "attempt_unavailable");
    }

    const { error: connectionError } = await admin.from("social_connections").upsert(
      {
        workspace_id: workspace.id,
        provider: "instagram",
        status: "oauth_started",
        last_error_code: null,
        last_error_at: null,
        connected_at: null,
        disconnected_at: null,
      },
      { onConflict: "workspace_id,provider" },
    );

    if (connectionError) {
      await admin.from("instagram_oauth_attempts").delete().eq("id", attempt.id);
      return redirectWithError(request, "connection_unavailable");
    }

    const authorizationUrl = buildInstagramAuthorizationUrl({
      appId: oauthConfig.appId,
      redirectUri: oauthConfig.redirectUri,
      state,
    });

    return NextResponse.redirect(authorizationUrl, 303);
  } catch {
    return redirectWithError(request, "configuration_unavailable");
  }
}

function hasTrustedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

function redirectWithError(request: NextRequest, code: string) {
  const url = new URL(ONBOARDING_PATH, request.url);
  url.searchParams.set("error", code);
  return NextResponse.redirect(url, 303);
}
