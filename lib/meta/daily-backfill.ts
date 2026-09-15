import type { InsightWindow } from "./insight-periods";

/**
 * Métricas sin serie diaria propia en la API: Meta sólo las entrega como total de
 * una ventana. Se reconstruye su histórico pidiendo una ventana por día.
 *
 * Todas son sumables día por día. Las que cuentan cuentas únicas —alcance, cuentas
 * con interacción— quedan fuera: su total de un período no es la suma de sus días.
 */
export const BACKFILL_METRICS = [
  "views",
  "total_interactions",
  "likes",
  "comments",
  "shares",
  "saves",
  "profile_views",
  "profile_links_taps",
] as const;

export type BackfillMetric = (typeof BACKFILL_METRICS)[number];

export type BackfillRequest = {
  metric: BackfillMetric;
  window: InsightWindow;
};

/**
 * Tope de llamadas del backfill por corrida.
 *
 * 180 es lo que ya corrió sin problemas al reconstruir views e interacciones. Al
 * sumar métricas nuevas el trabajo pendiente supera ese número, así que se reparte
 * en varias corridas en lugar de disparar cientos de llamadas de golpe. Después de
 * completarse, cada corrida sólo pide el día nuevo de cada métrica.
 */
export const BACKFILL_REQUESTS_PER_RUN = 180;

const DAY_IN_SECONDS = 24 * 60 * 60;

/**
 * Fin del día en curso, para fechar una foto tomada hoy.
 *
 * Sigue la misma convención que la serie diaria de Meta —`end_time` marca el final
 * del día— para que un día quede en el mismo casillero sin importar qué métrica sea.
 * Como todas las sincronizaciones del mismo día producen el mismo valor, el upsert
 * deja una sola fila por día con la última lectura.
 */
export function endOfDay(now: Date) {
  const millisPerDay = DAY_IN_SECONDS * 1000;
  return new Date((Math.floor(now.getTime() / millisPerDay) + 1) * millisPerDay).toISOString();
}

/**
 * Decide qué días pedir de cada métrica.
 *
 * Cada métrica lleva su propia cuenta de días guardados: que views ya tenga un día
 * no significa que me gusta lo tenga. Recorre del día más reciente al más viejo y,
 * dentro de cada día, todas las métricas, así el período corto queda completo antes
 * que el largo cuando el tope corta la corrida.
 *
 * Cada ventana cubre `[inicio de día, fin de día)` y se identifica por su `until`,
 * la misma convención que usa la serie diaria que Meta ya devuelve. Se compara por
 * fecha porque Meta informa ese fin de día en el huso de la cuenta, no a medianoche UTC.
 */
export function planDailyBackfill({
  knownEndTimesByMetric,
  now,
  lookbackDays,
  metrics = BACKFILL_METRICS,
  budget = BACKFILL_REQUESTS_PER_RUN,
}: {
  knownEndTimesByMetric: ReadonlyMap<string, Iterable<string>>;
  now: Date;
  lookbackDays: number;
  metrics?: readonly BackfillMetric[];
  budget?: number;
}): BackfillRequest[] {
  const knownDays = new Map(
    metrics.map((metric) => [
      metric,
      new Set(Array.from(knownEndTimesByMetric.get(metric) ?? [], (end) => end.slice(0, 10))),
    ]),
  );
  const midnight = Math.floor(now.getTime() / 1000 / DAY_IN_SECONDS) * DAY_IN_SECONDS;
  const plan: BackfillRequest[] = [];

  // `offset` 1 es el último día completo; el día en curso todavía se está acumulando.
  for (let offset = 1; offset <= lookbackDays; offset += 1) {
    const until = midnight - (offset - 1) * DAY_IN_SECONDS;
    const end = new Date(until * 1000).toISOString();

    for (const metric of metrics) {
      if (plan.length >= budget) return plan;
      if (knownDays.get(metric)?.has(end.slice(0, 10))) continue;

      plan.push({ metric, window: { since: until - DAY_IN_SECONDS, until, end } });
    }
  }

  return plan;
}
