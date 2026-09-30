/** Seis horas: margen amplio para video, sin aceptar valores evidentemente corruptos. */
export const MAX_MEDIA_DURATION_MS = 6 * 60 * 60 * 1000;

/** Convierte la duración leída por HTMLMediaElement en un valor seguro para persistir. */
export function durationMsFromSeconds(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;

  const durationMs = Math.round(value * 1000);
  return durationMs <= MAX_MEDIA_DURATION_MS ? durationMs : null;
}

/** Convierte el valor persistido en segundos para la UI y descarta datos inválidos. */
export function durationSecondsFromMs(value: number | null) {
  if (
    value === null ||
    !Number.isInteger(value) ||
    value <= 0 ||
    value > MAX_MEDIA_DURATION_MS
  ) {
    return null;
  }

  return value / 1000;
}
