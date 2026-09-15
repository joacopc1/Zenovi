/**
 * Cuándo renovar el token de Instagram.
 *
 * Meta entrega tokens de 60 días que se pueden renovar por otros 60 si tienen al menos
 * 24 horas y todavía no vencieron. Uno que pasa 60 días sin renovarse ya no se recupera:
 * la persona tiene que volver a conectar la cuenta.
 */

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** Antigüedad mínima que exige Meta para aceptar la renovación. */
export const TOKEN_MIN_AGE_MS = 24 * HOUR_MS;

/**
 * Se renueva cuando faltan 20 días o menos. Renovar todos los días también funcionaría,
 * pero así cada token cambia sólo una vez por ciclo y, si Meta falla, quedan casi tres
 * semanas de sincronizaciones diarias para reintentar antes del vencimiento.
 */
export const REFRESH_WHEN_DAYS_LEFT = 20;

export type TokenRefreshDecision = "refresh" | "wait" | "expired";

export function decideTokenRefresh({
  issuedAt,
  expiresAt,
  now,
}: {
  /** Cuándo se emitió o renovó el token vigente. */
  issuedAt: string;
  expiresAt: string | null;
  now: Date;
}): TokenRefreshDecision {
  const current = now.getTime();

  if (expiresAt !== null && Date.parse(expiresAt) <= current) return "expired";
  if (current - Date.parse(issuedAt) < TOKEN_MIN_AGE_MS) return "wait";

  // Sin fecha de vencimiento conocida conviene renovar: la respuesta trae una.
  if (expiresAt === null) return "refresh";

  return Date.parse(expiresAt) - current <= REFRESH_WHEN_DAYS_LEFT * DAY_MS ? "refresh" : "wait";
}
