import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { RATE_LIMITS, rateLimitKey, type RateLimitRule } from "./rate-limit-rules";

/**
 * Cuenta un pedido y dice si entra en el límite. Si la base no responde se deja pasar y
 * se avisa en los logs: los créditos siguen frenando el gasto, y un fallo nuestro no debe
 * dejar a todos sin poder usar la app.
 */
export async function takeRateLimit(rule: RateLimitRule, subject: string) {
  const { limit, windowSeconds } = RATE_LIMITS[rule];
  const { data, error } = await createAdminClient().rpc("hit_rate_limit", {
    p_key: rateLimitKey(rule, subject),
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error(JSON.stringify({ event: "rate_limit", error: "check_failed", rule, code: error.code }));
    return true;
  }
  if (data === false) console.warn(JSON.stringify({ event: "rate_limit", warning: "limited", rule }));
  return data !== false;
}

export const RATE_LIMITED_MESSAGE = "Estás yendo muy rápido. Esperá un momento y probá de nuevo.";
