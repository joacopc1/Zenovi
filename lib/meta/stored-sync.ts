import "server-only";

import { syncInstagramConnection } from "@/lib/meta/sync";
import { decryptMetaToken, type EncryptedSecret } from "@/lib/meta/token-crypto";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export async function syncStoredInstagramConnection(
  admin: AdminClient,
  connectionId: string,
) {
  const [{ data: socialAccount, error: accountError }, { data: credential, error: credentialError }] =
    await Promise.all([
      admin
        .from("social_accounts")
        .select("id, provider_account_id")
        .eq("connection_id", connectionId)
        .maybeSingle(),
      admin
        .from("instagram_connection_credentials")
        .select(
          "access_token_ciphertext, access_token_iv, access_token_auth_tag, encryption_key_version, expires_at",
        )
        .eq("connection_id", connectionId)
        .maybeSingle(),
    ]);

  if (accountError || credentialError || !socialAccount || !credential) {
    return { ok: false as const, code: "connection_unavailable" };
  }

  if (credential.expires_at && new Date(credential.expires_at).getTime() <= Date.now()) {
    await setConnectionFailure(admin, connectionId, "authorization_expired", "action_required");
    return { ok: false as const, code: "authorization_expired" };
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
    await setConnectionFailure(admin, connectionId, "credential_unavailable", "failed");
    return { ok: false as const, code: "credential_unavailable" };
  }

  return syncInstagramConnection({
    admin,
    connectionId,
    socialAccountId: socialAccount.id,
    providerAccountId: socialAccount.provider_account_id,
    accessToken,
  });
}

async function setConnectionFailure(
  admin: AdminClient,
  connectionId: string,
  code: string,
  status: "action_required" | "failed",
) {
  await admin
    .from("social_connections")
    .update({
      status,
      last_error_code: code,
      last_error_at: new Date().toISOString(),
    })
    .eq("id", connectionId);
}
