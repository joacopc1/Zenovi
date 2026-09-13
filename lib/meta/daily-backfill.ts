import type { InsightWindow } from "./insight-periods";

/**
 * Métricas sin serie diaria propia en la API: Meta sólo las entrega como total de
 * una ventana. Se reconstruye su histórico pidiendo una ventana por día.
 */
export const BACKFILL_METRICS = ["views", "total_interactions"] as const;

/**
 * Cuántos días se rellenan por corrida: el período completo, para que la primera
 * sincronización deje las analíticas de 90 días listas.
 *
 * Son ~180 llamadas extra en esa primera corrida y después sólo una por día. El
 * backfill corre al final y es best-effort, así que si Meta corta por límite de
 * peticiones, lo demás ya quedó guardado y estos días se reintentan luego. Si
 * aparecen fallos por rate limit, bajar esta constante reparte el trabajo en
 * varias corridas sin ningún otro cambio.
 */
export const BACKFILL_DAYS_PER_RUN = 90;

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
 * Devuelve las ventanas de un día que todavía no tienen valor guardado, de la más
 * reciente a la más vieja, para que lo primero que se complete sea lo que el usuario
 * mira primero.
 *
 * Cada ventana cubre `[inicio de día, fin de día)` y se identifica por su `until`,
 * que es la misma convención que usa la serie diaria que Meta ya devuelve: `end_time`
 * marca el final del día medido.
 */
export function findMissingDailyWindows({
  knownEndTimes,
  now,
  lookbackDays,
  limit = BACKFILL_DAYS_PER_RUN,
}: {
  knownEndTimes: Iterable<string>;
  now: Date;
  lookbackDays: number;
  limit?: number;
}): InsightWindow[] {
  const known = new Set<string>();
  for (const endTime of knownEndTimes) known.add(endTime.slice(0, 10));

  const midnight = Math.floor(now.getTime() / 1000 / DAY_IN_SECONDS) * DAY_IN_SECONDS;
  const windows: InsightWindow[] = [];

  // `offset` 1 es el último día completo; el día en curso todavía se está acumulando.
  for (let offset = 1; offset <= lookbackDays && windows.length < limit; offset += 1) {
    const until = midnight - (offset - 1) * DAY_IN_SECONDS;
    const end = new Date(until * 1000).toISOString();

    if (known.has(end.slice(0, 10))) continue;

    windows.push({ since: until - DAY_IN_SECONDS, until, end });
  }

  return windows;
}
