import { NextResponse, type NextRequest } from "next/server";
import { getInstagramOAuthConfig } from "@/lib/meta/config";
import { deleteInstagramConnections } from "@/lib/meta/delete-connection";
import { createDeletionCode, parseSignedRequest } from "@/lib/meta/signed-request";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Callback de borrado de datos de Meta.
 *
 * Meta lo llama cuando alguien quita Zenovi desde la configuración de Instagram o pide
 * borrar sus datos. No hay sesión: la autenticación es la firma del `signed_request`,
 * hecha con el secreto de la app. Se borra toda conexión de esa cuenta y se responde con
 * el código y la URL donde la persona puede ver el estado, que es lo que Meta exige.
 *
 * Es idempotente: si la cuenta ya no está, igual se confirma el pedido, porque para
 * quien lo hizo el resultado es el mismo —sus datos no están.
 */
export async function POST(request: NextRequest) {
  let signedRequest: FormDataEntryValue | null = null;
  try {
    signedRequest = (await request.formData()).get("signed_request");
  } catch {
    return badRequest();
  }

  if (typeof signedRequest !== "string") {
    logOutcome("missing_signed_request");
    return badRequest();
  }

  const { appSecret } = getInstagramOAuthConfig();
  const parsed = parseSignedRequest(signedRequest, appSecret);
  if (parsed === null) {
    logOutcome("invalid_signature");
    return badRequest();
  }

  const admin = createAdminClient();
  const { data: accounts, error } = await admin
    .from("social_accounts")
    .select("connection_id")
    .eq("provider_account_id", parsed.userId);

  if (error) {
    logOutcome("lookup_failed", parsed.userId);
    return NextResponse.json({ error: "deletion_unavailable" }, { status: 503 });
  }

  const result = await deleteInstagramConnections(
    admin,
    (accounts ?? []).map((account) => account.connection_id),
  );

  if (!result.ok) {
    logOutcome("delete_failed", parsed.userId);
    return NextResponse.json({ error: "deletion_unavailable" }, { status: 503 });
  }

  logOutcome("accepted", parsed.userId, result.deleted);

  const code = createDeletionCode(new Date(), appSecret);
  const statusUrl = new URL("/data-deletion", request.nextUrl.origin);
  statusUrl.searchParams.set("code", code);

  return NextResponse.json({ url: statusUrl.toString(), confirmation_code: code });
}

/**
 * Deja rastro de cada pedido de Meta en los logs de Vercel, sin datos personales.
 *
 * Del id sólo se registran los últimos cuatro dígitos: alcanzan para compararlo con la
 * cuenta guardada cuando un borrado no ocurre, y no identifican a nadie por sí solos.
 * Sin este registro, un pedido rechazado o sin coincidencia es indistinguible de uno
 * que nunca llegó.
 */
function logOutcome(outcome: string, userId?: string, deletedConnections?: number) {
  console.info(
    JSON.stringify({
      event: "instagram_data_deletion",
      outcome,
      userIdSuffix: userId?.slice(-4) ?? null,
      deletedConnections: deletedConnections ?? null,
    }),
  );
}

function badRequest() {
  return NextResponse.json({ error: "invalid_signed_request" }, { status: 400 });
}
