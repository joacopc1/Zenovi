export const ONBOARDING_PATH = "/onboarding/instagram";

/** Pantallas que pueden lanzar una sincronización y a las que se vuelve después. */
const RETURN_PATHS = new Set(["/", "/analytics", "/content"]);

const PARSING_ORIGIN = "http://zenovi.invalid";

/**
 * Decide a dónde volver después de sincronizar a partir de lo que mandó el formulario.
 *
 * Es una lista blanca a propósito: el valor llega del cliente, así que aceptar
 * cualquier ruta permitiría usar el endpoint para redirigir a otro sitio. Todo lo que
 * no sea una pantalla conocida vuelve al onboarding, igual que antes.
 *
 * `rangeDays` son los períodos válidos de Analíticas; los recibe en lugar de
 * importarlos para que este módulo siga siendo puro y testeable sin el bundler.
 */
export function resolveSyncReturnPath(raw: unknown, rangeDays: readonly number[]): string {
  if (typeof raw !== "string" || !raw.startsWith("/")) return ONBOARDING_PATH;

  let url: URL;
  try {
    url = new URL(raw, PARSING_ORIGIN);
  } catch {
    return ONBOARDING_PATH;
  }

  // `//otro.sitio` o `/\otro.sitio` se resuelven fuera del origen propio.
  if (url.origin !== PARSING_ORIGIN || !RETURN_PATHS.has(url.pathname)) {
    return ONBOARDING_PATH;
  }

  // Analíticas conserva el período elegido; cualquier otro parámetro se descarta.
  const days = Number(url.searchParams.get("days"));
  if (url.pathname === "/analytics" && rangeDays.includes(days)) {
    return `/analytics?days=${days}`;
  }

  return url.pathname;
}
