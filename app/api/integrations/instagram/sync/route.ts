import { NextResponse, type NextRequest } from "next/server";
import { decryptMetaToken, type EncryptedSecret } from "@/lib/meta/token-crypto";
import { syncInstagramConnection } from "@/lib/meta/sync";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const redirectPath = await readRedirectPath(request);

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (workspaceError || !workspace) {
    return redirectWithError(request, redirectPath, "workspace_unavailable");
  }

  const admin = createAdminClient();
  const { data: connection, error: connectionError } = await admin
    .from("social_connections")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("provider", "instagram")
    .maybeSingle();

  if (connectionError || !connection) {
    return redirectWithError(request, redirectPath, "connection_unavailable");
  }

  const [{ data: socialAccount, error: accountError }, { data: credential, error: credentialError }] =
    await Promise.all([
      admin
        .from("social_accounts")
        .select("id, provider_account_id")
        .eq("connection_id", connection.id)
        .maybeSingle(),
      admin
        .from("instagram_connection_credentials")
        .select(
          "access_token_ciphertext, access_token_iv, access_token_auth_tag, encryption_key_version, expires_at",
        )
        .eq("connection_id", connection.id)
        .maybeSingle(),
    ]);

  if (accountError || credentialError || !socialAccount || !credential) {
    return redirectWithError(request, redirectPath, "connection_unavailable");
  }

  if (credential.expires_at && new Date(credential.expires_at).getTime() <= Date.now()) {
    await admin
      .from("social_connections")
      .update({
        status: "action_required",
        last_error_code: "authorization_expired",
        last_error_at: new Date().toISOString(),
      })
      .eq("id", connection.id);

    return redirectWithError(request, "/onboarding/instagram", "authorization_expired");
  }

  let accessToken: string;

  try {
    accessToken = decryptMetaToken({
      ciphertext: credential.access_token_ciphertext,
      iv: credential.access_token_iv,
      authTag: credential.access_token_auth_tag,
      keyVersion: credential.encryption_key_version,
    } as EncryptedSecret);
  } catch {
    return redirectWithError(request, redirectPath, "connection_unavailable");
  }

  const syncResult = await syncInstagramConnection({
    admin,
    connectionId: connection.id,
    socialAccountId: socialAccount.id,
    providerAccountId: socialAccount.provider_account_id,
    accessToken,
  });

  if (!syncResult.ok) {
    return redirectWithError(request, redirectPath, "initial_sync_failed");
  }

  const destination = new URL(redirectPath, request.url);
  destination.searchParams.set(
    redirectPath === "/onboarding/instagram" ? "connected" : "sync",
    redirectPath === "/onboarding/instagram" ? "1" : "updated",
  );
  return NextResponse.redirect(destination, 303);
}

async function readRedirectPath(request: NextRequest) {
  try {
    const formData = await request.formData();
    return formData.get("redirectTo") === "/" ? "/" : "/onboarding/instagram";
  } catch {
    return "/onboarding/instagram";
  }
}

function redirectWithError(request: NextRequest, path: string, code: string) {
  const destination = new URL(path, request.url);
  destination.searchParams.set(path === "/" ? "sync" : "error", path === "/" ? "error" : code);
  return NextResponse.redirect(destination, 303);
}
