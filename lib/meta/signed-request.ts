import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Pedidos firmados de Meta y códigos de confirmación de borrado.
 *
 * Cuando alguien quita la app desde Instagram o pide borrar sus datos, Meta hace un POST
 * con `signed_request`: `<firma>.<payload>`, las dos partes en base64 URL, y la firma es
 * un HMAC-SHA256 del payload con el secreto de la app. Sin verificar la firma, cualquiera
 * podría borrar la cuenta de otro mandando un `user_id` inventado.
 *
 * El código de confirmación no se guarda en ninguna tabla: lleva adentro la fecha del
 * pedido y su propia firma, así la página de estado lo puede validar sin base de datos y
 * nadie lo puede fabricar. A propósito no incluye el `user_id`: ese código se muestra en
 * una URL pública.
 */

export type SignedRequest = { userId: string; issuedAt: number | null };

export function parseSignedRequest(signedRequest: string, appSecret: string): SignedRequest | null {
  const [encodedSignature, encodedPayload, extra] = signedRequest.split(".");
  if (!encodedSignature || !encodedPayload || extra !== undefined) return null;

  const expected = sign(encodedPayload, appSecret);
  if (!sameBytes(Buffer.from(encodedSignature, "base64url"), expected)) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof payload !== "object" || payload === null) return null;
  const record = payload as Record<string, unknown>;

  if (typeof record.algorithm !== "string" || record.algorithm.toUpperCase() !== "HMAC-SHA256") return null;

  // Meta manda el id como texto o como número según la variante; se normaliza a texto.
  const userId =
    typeof record.user_id === "string"
      ? record.user_id
      : typeof record.user_id === "number"
        ? String(record.user_id)
        : null;
  if (userId === null || !/^\d{1,32}$/.test(userId)) return null;

  return { userId, issuedAt: typeof record.issued_at === "number" ? record.issued_at : null };
}

/** `<fecha en segundos>.<firma>`, en base64 URL: se puede poner en una URL tal cual. */
export function createDeletionCode(now: Date, secret: string) {
  const issued = Buffer.from(String(Math.floor(now.getTime() / 1000))).toString("base64url");
  return `${issued}.${sign(`deletion:${issued}`, secret).toString("base64url")}`;
}

/** La fecha del pedido si el código es auténtico; `null` si fue alterado o no es un código. */
export function readDeletionCode(code: string, secret: string): Date | null {
  const [issued, signature, extra] = code.split(".");
  if (!issued || !signature || extra !== undefined) return null;
  if (!sameBytes(Buffer.from(signature, "base64url"), sign(`deletion:${issued}`, secret))) return null;

  const seconds = Number(Buffer.from(issued, "base64url").toString("utf8"));
  return Number.isSafeInteger(seconds) && seconds > 0 ? new Date(seconds * 1000) : null;
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest();
}

/** Comparación en tiempo constante: no deja adivinar la firma midiendo cuánto tarda. */
function sameBytes(left: Buffer, right: Buffer) {
  return left.length === right.length && timingSafeEqual(left, right);
}
