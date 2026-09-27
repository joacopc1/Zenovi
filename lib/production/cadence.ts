/**
 * El semáforo de cadencia: si el creador va a llegar o no a su propio ritmo.
 *
 * Un tablero con tarjetas no compromete a nadie. Lo que compromete es que la app diga en
 * una línea "venís publicando tres por semana y para los próximos siete días tenés una".
 * Eso convierte la grilla en una señal.
 *
 * Tanto el ritmo como lo que ya salió se leen de Instagram y no del tablero: una pieza
 * publicada cuenta aunque el creador nunca la haya anotado en Zenovi. El ritmo tampoco se
 * le pregunta ni se le impone como meta: se lee de lo que realmente publicó. Es la única medida que no discute —es su propio historial— y no
 * exige configurar nada antes de servir.
 *
 * Todo lo de acá es cálculo puro sobre fechas: no toca la base ni la pantalla, para poder
 * probar los casos que importan, que son los de poca historia.
 */
import { addDays, isoDateOf } from "./calendar.ts";

/** Cuántas semanas hacia atrás se mira para leer el ritmo. */
export const RHYTHM_WEEKS = 8;

/**
 * Cuántas publicaciones hacen falta para afirmar un ritmo.
 *
 * Con dos o tres en dos meses no hay cadencia que leer, hay casualidad. Antes de eso la
 * app dice que todavía no sabe, que es distinto de decir "publicás 0,4 por semana".
 */
export const MIN_POSTS_FOR_RHYTHM = 4;

/** Hasta dónde mira el tablero hacia adelante. */
export const PLANNING_HORIZON_DAYS = 7;

export type CadenceReading = {
  /** Publicaciones por semana, redondeado a una decimal; `null` sin historial suficiente. */
  rhythm: number | null;
  /** Lo que ya salió en el horizonte hacia atrás, haya pasado o no por el tablero. */
  published: number;
  /** Días desde la última publicación; `null` si no hay ninguna en la ventana de ritmo. */
  daysSinceLast: number | null;
  /** Piezas con fecha objetivo dentro del horizonte. */
  planned: number;
  /** De esas, cuántas todavía no tienen guion escrito. */
  withoutScript: number;
  /** Cuántas faltarían para igualar el ritmo propio; `null` si no hay ritmo que igualar. */
  missing: number | null;
};

/**
 * Lo que ya salió, mirando hacia atrás.
 *
 * Se lee de Instagram y no del tablero a propósito: una pieza publicada cuenta para la
 * cadencia aunque el creador nunca la haya anotado en Zenovi. Medir sólo lo documentado
 * diría que está en falta cuando en realidad publicó.
 */
export function recentlyPublished(
  postedAt: readonly string[],
  now: Date,
  horizon: number = PLANNING_HORIZON_DAYS,
): { count: number; daysSinceLast: number | null } {
  // `horizon - 1`: hacia adelante se cuentan hoy y los seis que siguen, así que hacia
  // atrás tienen que ser hoy y los seis anteriores. Con `-horizon` la ventana medía ocho
  // días contra siete y "vas al día" aparecía con el creador atrasado.
  const since = addDays(now, -(horizon - 1)).getTime();
  const rhythmSince = addDays(now, -RHYTHM_WEEKS * 7).getTime();
  let count = 0;
  let latest: number | null = null;

  for (const value of postedAt) {
    const time = Date.parse(value);
    if (Number.isNaN(time) || time > now.getTime()) continue;
    if (time >= since) count += 1;
    if (time >= rhythmSince && (latest === null || time > latest)) latest = time;
  }

  return {
    count,
    // En días de calendario y no en horas: lo de ayer a las nueve de la noche es de ayer,
    // aunque hayan pasado trece horas.
    daysSinceLast: latest === null ? null : calendarDaysBetween(latest, now),
  };
}

/**
 * Cuántas veces por semana viene publicando, según lo que realmente subió.
 *
 * Se cuentan sólo las piezas del feed —Reels y publicaciones—: las Historias tienen otra
 * frecuencia, se suben de a varias por día y taparían la cadencia que importa acá, que es
 * la de las piezas que se planifican.
 */
export function weeklyRhythm(postedAt: readonly string[], now: Date): number | null {
  const since = addDays(now, -RHYTHM_WEEKS * 7).getTime();
  let count = 0;

  for (const value of postedAt) {
    const time = Date.parse(value);
    if (!Number.isNaN(time) && time >= since && time <= now.getTime()) count += 1;
  }

  if (count < MIN_POSTS_FOR_RHYTHM) return null;

  return Math.round((count / RHYTHM_WEEKS) * 10) / 10;
}

/** Los días que entran en el horizonte, desde hoy, como "YYYY-MM-DD". */
export function horizonDates(now: Date, horizon: number = PLANNING_HORIZON_DAYS): string[] {
  const dates: string[] = [];
  for (let offset = 0; offset < horizon; offset += 1) {
    dates.push(isoDateOf(addDays(now, offset)));
  }

  return dates;
}

/**
 * La lectura completa: el ritmo propio contra lo que hay planificado.
 *
 * Una pieza ya publicada no cuenta como planificada aunque su fecha objetivo caiga en la
 * semana: ya salió, y contarla haría parecer que falta menos de lo que falta.
 */
export function readCadence(
  items: readonly { targetDate: string | null; status: string; hook: string; development: string }[],
  postedAt: readonly string[],
  now: Date,
  horizon: number = PLANNING_HORIZON_DAYS,
): CadenceReading {
  const window = new Set(horizonDates(now, horizon));
  const planned = items.filter(
    (item) => item.status !== "publicada" && item.targetDate !== null && window.has(item.targetDate),
  );

  const rhythm = weeklyRhythm(postedAt, now);
  const expected = rhythm === null ? null : Math.round((rhythm * horizon) / 7);
  const { count: published, daysSinceLast } = recentlyPublished(postedAt, now, horizon);

  return {
    rhythm,
    published,
    daysSinceLast,
    planned: planned.length,
    withoutScript: planned.filter((item) => !hasScript(item)).length,
    // Lo que ya salió cubre parte del ritmo: pedirle al creador que planifique tres más
    // cuando hoy publicó dos sería contarle la semana desde cero.
    missing: expected === null ? null : Math.max(0, expected - planned.length - published),
  };
}

/** Días de calendario entre dos instantes, mirando el día y no las horas. */
function calendarDaysBetween(from: number, to: Date): number {
  const a = new Date(from);
  const start = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const end = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());

  return Math.round((end - start) / 86_400_000);
}

/** Un guion empieza a existir cuando hay hook o desarrollo; el CTA solo no alcanza. */
function hasScript(item: { hook: string; development: string }): boolean {
  return item.hook.trim().length > 0 || item.development.trim().length > 0;
}
