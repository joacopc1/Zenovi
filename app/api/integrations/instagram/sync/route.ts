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

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (workspaceError || !workspace) {
    return redirectWithError(request, "workspace_unavailable");
  }

  const admin = createAdminClient();
  const { data: connection, error: connectionError } = await admin
    .from("social_connections")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("provider", "instagram")
    .maybeSingle();

  if (connectionError || !connection) {
    return redirectWithError(request, "connection_unavailable");
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
    return redirectWithError(request, "connection_unavailable");
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

    return redirectWithError(request, "authorization_expired");
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
    return redirectWithError(request, "connection_unavailable");
  }

  const syncResult = await syncInstagramConnection({
    admin,
    connectionId: connection.id,
    socialAccountId: socialAccount.id,
    providerAccountId: socialAccount.provider_account_id,
    accessToken,
  });

  if (!syncResult.ok) {
    return redirectWithError(request, "initial_sync_failed");
  }

  const destination = new URL("/onboarding/instagram", request.url);
  destination.searchParams.set("connected", "1");
  return NextResponse.redirect(destination, 303);
}

function redirectWithError(request: NextRequest, code: string) {
  const destination = new URL("/onboarding/instagram", request.url);
  destination.searchParams.set("error", code);
  return NextResponse.redirect(destination, 303);
}
