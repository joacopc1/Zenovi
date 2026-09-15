import type { InstagramDailyMetric } from "../data/daily-metric-series";

/**
 * Métricas que se pueden sumar día por día. El alcance no está: cuenta cuentas
 * únicas, y sumar alcances diarios contaría dos veces a quien volvió otro día.
 */
export type AdditiveMetric =
  | "views"
  | "interactions"
  | "likes"
  | "comments"
  | "shares"
  | "saves"
  | "profileViews"
  | "linkTaps";

export type PeriodTotal = {
  /** Suma de los días informados; `null` si ningún día del período tiene dato. */
  current: number | null;
  /**
   * Total del período anterior de igual largo. `null` cuando la base no guarda ese
   * período completo: comparar contra un período a medias daría un porcentaje falso.
   */
  previous: number | null;
  /** Días del período actual que Instagram efectivamente informó. */
  reportedDays: number;
  days: number;
};

/**
 * Meta avisa que las métricas de cuenta pueden demorar hasta 48 horas. Los días
 * finales sin dato dentro de ese margen todavía no cerraron: no son un hueco.
 */
export const REPORTING_DELAY_DAYS = 2;

/**
 * Totaliza el período elegido a partir de la serie diaria completa.
 *
 * El período termina en el último día ya cerrado, no en hoy: si no, cada mañana
 * antes de la sincronización todas las cifras aparecerían como parciales.
 *
 * `series` debe ser la serie entera guardada, no el recorte que se grafica: el
 * período anterior vive justo antes del actual.
 */
export function summarizePeriod(
  series: readonly InstagramDailyMetric[],
  metric: AdditiveMetric,
  days: number,
): PeriodTotal {
  const closed = series.slice(0, closedLength(series, metric));
  const currentWindow = closed.slice(-days);
  const previousWindow = closed.length >= days * 2 ? closed.slice(-days * 2, -days) : [];
  const previousComplete =
    previousWindow.length === days && previousWindow.every((point) => point[metric] !== null);

  return {
    current: sumReported(currentWindow, metric),
    previous: previousComplete ? sumReported(previousWindow, metric) : null,
    reportedDays: currentWindow.filter((point) => point[metric] !== null).length,
    days,
  };
}

function sumReported(points: readonly InstagramDailyMetric[], metric: AdditiveMetric) {
  let total: number | null = null;

  for (const point of points) {
    const value = point[metric];
    if (value !== null) total = (total ?? 0) + value;
  }

  return total;
}

/**
 * Los días del período elegido que ya cerraron para esa métrica: el mismo recorte
 * que usa `summarizePeriod`, para que cualquier cálculo derivado mire los mismos días.
 */
export function closedWindow(
  series: readonly InstagramDailyMetric[],
  metric: AdditiveMetric,
  days: number,
) {
  return series.slice(0, closedLength(series, metric)).slice(-days);
}

/**
 * Largo de la serie sin los días finales que siguen dentro del margen de demora.
 * Un corte más largo sí se considera falta de datos y queda dentro del período.
 */
function closedLength(series: readonly InstagramDailyMetric[], metric: AdditiveMetric) {
  let end = series.length;
  const limit = Math.max(series.length - REPORTING_DELAY_DAYS, 0);

  while (end > limit && series[end - 1][metric] === null) end -= 1;

  return end;
}
