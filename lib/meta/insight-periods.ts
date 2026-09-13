/**
 * Meta conserva los insights de cuenta 90 días y después los borra. Ese es el techo
 * de lo que se puede pedir y, por lo tanto, el objetivo del backfill: todo lo anterior
 * sólo puede existir en nuestra propia base.
 */
export const ACCOUNT_INSIGHT_LOOKBACK_DAYS = 90;
export const ACCOUNT_COMPARISON_DAYS = 7;

/**
 * Tamaño máximo de cada consulta de serie diaria.
 *
 * La documentación no garantiza que un rango de 90 días se devuelva completo en una
 * sola llamada, así que la ventana se parte en tramos de 30. Si el límite existe, esto
 * lo respeta; si no existe, el único costo son dos requests extra.
 */
export const MAX_INSIGHT_WINDOW_DAYS = 30;

const DAY_IN_SECONDS = 24 * 60 * 60;

export type InsightWindow = {
  end: string;
  since: number;
  until: number;
};

export function buildAccountInsightWindows(now = new Date()) {
  const until = Math.floor(now.getTime() / 1000);
  const currentSince = until - ACCOUNT_COMPARISON_DAYS * DAY_IN_SECONDS;
  const previousSince = currentSince - ACCOUNT_COMPARISON_DAYS * DAY_IN_SECONDS;
  const daily = createWindow(until - ACCOUNT_INSIGHT_LOOKBACK_DAYS * DAY_IN_SECONDS, until);

  return {
    daily,
    dailyChunks: splitWindow(daily, MAX_INSIGHT_WINDOW_DAYS),
    current: createWindow(currentSince, until),
    previous: createWindow(previousSince, currentSince),
  };
}

/** Parte una ventana en tramos contiguos que no superan `maxDays`. */
export function splitWindow(window: InsightWindow, maxDays: number): InsightWindow[] {
  const span = maxDays * DAY_IN_SECONDS;
  const chunks: InsightWindow[] = [];

  for (let since = window.since; since < window.until; since += span) {
    chunks.push(createWindow(since, Math.min(since + span, window.until)));
  }

  return chunks;
}

function createWindow(since: number, until: number): InsightWindow {
  return {
    since,
    until,
    end: new Date(until * 1000).toISOString(),
  };
}
