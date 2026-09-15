import "server-only";

import { refreshInstagramLongLivedToken } from "@/lib/meta/api";
import { syncInstagramConnection } from "@/lib/meta/sync";
import { decryptMetaToken, encryptMetaToken, type EncryptedSecret } from "@/lib/meta/token-crypto";
import { decideTokenRefresh } from "@/lib/meta/token-refresh";
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
          "access_token_ciphertext, access_token_iv, access_token_auth_tag, encryption_key_version, expires_at, updated_at",
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

  const decision = decideTokenRefresh({
    issuedAt: credential.updated_at,
    expiresAt: credential.expires_at,
    now: new Date(),
  });

  if (decision === "refresh") {
    accessToken = await renewAccessToken(admin, connectionId, accessToken);
  }

  return syncInstagramConnection({
    admin,
    connectionId,
    socialAccountId: socialAccount.id,
    providerAccountId: socialAccount.provider_account_id,
    accessToken,
  });
}

/**
 * Renueva el token antes de que venza. Es best-effort: si Meta o el guardado fallan, se
 * sigue con el token actual —todavía válido— y la próxima sincronización lo reintenta.
 */
async function renewAccessToken(admin: AdminClient, connectionId: string, currentToken: string) {
  const refreshed = await refreshInstagramLongLivedToken(currentToken);
  if (!refreshed.ok) return currentToken;

  const encrypted = encryptMetaToken(refreshed.data.accessToken);
  await admin
    .from("instagram_connection_credentials")
    .update({
      access_token_ciphertext: encrypted.ciphertext,
      access_token_iv: encrypted.iv,
      access_token_auth_tag: encrypted.authTag,
      encryption_key_version: encrypted.keyVersion,
      expires_at: refreshed.data.expiresAt,
    })
    .eq("connection_id", connectionId);

  // El renovado vale seguro; si no se pudo guardar, la próxima corrida vuelve a renovar.
  return refreshed.data.accessToken;
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
