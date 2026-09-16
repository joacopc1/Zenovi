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
 * `rangeDays` y `tabs` son los valores válidos de Analíticas; los recibe en lugar de
 * importarlos para que este módulo siga siendo puro y testeable sin el bundler.
 */
export function resolveSyncReturnPath(
  raw: unknown,
  rangeDays: readonly number[],
  tabs: readonly string[] = [],
): string {
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

  // Analíticas vuelve a la misma vista: mismo período y misma pestaña. El resto se descarta.
  if (url.pathname === "/analytics") {
    const kept = new URLSearchParams();
    const days = Number(url.searchParams.get("days"));
    const tab = url.searchParams.get("tab");
    if (rangeDays.includes(days)) kept.set("days", String(days));
    if (tab !== null && tabs.includes(tab)) kept.set("tab", tab);
    const query = kept.toString();

    return query.length > 0 ? `/analytics?${query}` : "/analytics";
  }

  return url.pathname;
}
