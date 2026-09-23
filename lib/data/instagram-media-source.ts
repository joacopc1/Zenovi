import "server-only";

import { getInstagramMediaSource } from "@/lib/meta/api";
import { decryptMetaToken, type EncryptedSecret } from "@/lib/meta/token-crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Resuelve una URL reproducible sin exponer la credencial de Meta al navegador.
 *
 * El `workspaceId` ya fue autorizado por `getAccountContext`; aun usando el cliente
 * administrativo, cada búsqueda vuelve a acotarse a workspace, conexión y cuenta para
 * que un id de otra organización nunca alcance su token ni su contenido.
 */
export async function getFreshInstagramMediaSource(
  workspaceId: string,
  storedMediaId: string,
) {
  const admin = createAdminClient();
  const { data: connection } = await admin
    .from("social_connections")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("provider", "instagram")
    .eq("status", "connected")
    .maybeSingle();

  if (!connection) return null;

  const { data: account } = await admin
    .from("social_accounts")
    .select("id")
    .eq("connection_id", connection.id)
    .maybeSingle();

  if (!account) return null;

  const [{ data: media }, { data: credential }] = await Promise.all([
    admin
      .from("instagram_media")
      .select("provider_media_id")
      .eq("id", storedMediaId)
      .eq("social_account_id", account.id)
      .maybeSingle(),
    admin
      .from("instagram_connection_credentials")
      .select(
        "access_token_ciphertext, access_token_iv, access_token_auth_tag, encryption_key_version, expires_at",
      )
      .eq("connection_id", connection.id)
      .maybeSingle(),
  ]);

  if (!media || !credential || isExpired(credential.expires_at)) return null;

  let accessToken: string;
  try {
    accessToken = decryptMetaToken({
      ciphertext: credential.access_token_ciphertext,
      iv: credential.access_token_iv,
      authTag: credential.access_token_auth_tag,
      keyVersion: credential.encryption_key_version,
    } as EncryptedSecret);
  } catch {
    return null;
  }

  const source = await getInstagramMediaSource(media.provider_media_id, accessToken);
  return source.ok ? source.data : null;
}

function isExpired(expiresAt: string | null) {
  return expiresAt !== null && new Date(expiresAt).getTime() <= Date.now();
}
