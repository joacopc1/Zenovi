/**
 * Qué salió mal en una respuesta de error de Meta.
 *
 * Meta responde con distintos estados HTTP, pero lo que importa es el cuerpo: el código
 * 190 (`OAuthException`) significa que el acceso ya no sirve —venció, se revocó o la
 * persona quitó Zenovi desde Instagram—. Ese caso no es una falla pasajera que se
 * resuelve reintentando: la única salida es volver a autorizar, así que se distingue
 * del resto. Comprobado contra la API: un token inválido devuelve 401 con código 190.
 */
const INVALID_ACCESS_TOKEN = 190;

export const AUTHORIZATION_REVOKED = "authorization_revoked";

export function readMetaErrorCode(httpStatus: number, payload: unknown): string {
  if (typeof payload === "object" && payload !== null && "error" in payload) {
    const error = (payload as { error: unknown }).error;
    if (typeof error === "object" && error !== null && (error as { code?: unknown }).code === INVALID_ACCESS_TOKEN) {
      return AUTHORIZATION_REVOKED;
    }
  }

  return `meta_http_${httpStatus}`;
}

/** Los fallos que sólo se resuelven volviendo a autorizar en Instagram. */
export function requiresReauthorization(code: string) {
  return code === AUTHORIZATION_REVOKED || code === "authorization_expired";
}
