/**
 * Lo que cuesta usar la IA, y su traducción a créditos.
 *
 * El creador nunca ve tokens: ve créditos. Por dentro, cada operación guarda su costo real
 * en dólares y se convierte con una tasa fija, así la tabla de créditos de los planes se
 * dimensiona con lo medido y no con estimaciones.
 */

/** Un crédito equivale a un centavo de dólar de costo nuestro. */
export const USD_PER_CREDIT = 0.01;

/**
 * Créditos por mes y por workspace durante la beta, antes de los planes. Generoso a
 * propósito: unas 300 respuestas del Director, para medir el uso real sin cortar a nadie.
 */
export const BETA_MONTHLY_CREDITS = 1500;

type ModelPrice = { input: number; cacheRead: number; cacheWrite: number; output: number };

/**
 * Dólares por millón de tokens, precios de lista de Anthropic (2026-10-02). La escritura en
 * caché vale 1,25 veces la entrada; la lectura, una décima parte.
 */
const PRICES_PER_MILLION: Record<string, ModelPrice> = {
  "claude-sonnet-5-5": { input: 2, cacheRead: 0.2, cacheWrite: 2.5, output: 10 },
  "claude-haiku-4-5": { input: 1, cacheRead: 0.1, cacheWrite: 1.25, output: 5 },
};

export type TokenUsage = {
  /** Tokens de entrada sin caché. */
  inputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  /** Incluye el razonamiento: se cobra igual que la respuesta. */
  outputTokens: number;
};

export function usageCostUsd(model: string, usage: TokenUsage) {
  const price = PRICES_PER_MILLION[model];
  // Un modelo sin precio cargado es un error de configuración, no un uso gratis.
  if (!price) throw new Error(`missing_model_price:${model}`);
  return (
    usage.inputTokens * price.input
    + usage.cacheReadTokens * price.cacheRead
    + usage.cacheWriteTokens * price.cacheWrite
    + usage.outputTokens * price.output
  ) / 1_000_000;
}

export function usdToCredits(usd: number) {
  return Math.round((usd / USD_PER_CREDIT) * 100) / 100;
}

export type CreditBalance = {
  used: number;
  total: number;
  remaining: number;
  /** De 0 a 1, para el círculo del encabezado. */
  usedShare: number;
  /** Cuándo vuelve a llenarse: el primer día del mes siguiente. */
  resetsAt: string;
};

export function creditBalance(used: number, now = new Date(), total = BETA_MONTHLY_CREDITS): CreditBalance {
  const resetsAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return {
    used,
    total,
    remaining: Math.max(0, total - used),
    usedShare: total > 0 ? Math.min(1, used / total) : 1,
    resetsAt: resetsAt.toISOString(),
  };
}

/** Desde cuándo se cuenta el consumo del mes. */
export function creditPeriodStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}
