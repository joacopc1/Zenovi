/**
 * El semáforo de cadencia: si el creador va a llegar o no a su propio ritmo.
 *
 * Un tablero con tarjetas no compromete a nadie. Lo que compromete es que la app diga en
 * una línea "venís publicando tres por semana y para los próximos siete días tenés una".
 * Eso convierte la grilla en una señal.
 *
 * El ritmo no se le pregunta al creador ni se le impone una meta: se lee de lo que
 * realmente publicó. Es la única medida que no discute —es su propio historial— y no
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

export type UpcomingDay = {
  /** "YYYY-MM-DD" en la zona local. */
  iso: string;
  /** Día del mes, para rotular. */
  day: number;
  /** 0 = lunes. */
  weekday: number;
  isToday: boolean;
  planned: number;
};

export type CadenceReading = {
  /** Publicaciones por semana, redondeado a una decimal; `null` sin historial suficiente. */
  rhythm: number | null;
  /** Piezas con fecha objetivo dentro del horizonte. */
  planned: number;
  /** De esas, cuántas todavía no tienen guion escrito. */
  withoutScript: number;
  /** Cuántas faltarían para igualar el ritmo propio; `null` si no hay ritmo que igualar. */
  missing: number | null;
  days: UpcomingDay[];
};

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

/** Los próximos días, desde hoy, con cuántas piezas caen en cada uno. */
export function upcomingDays(
  items: readonly { targetDate: string | null }[],
  now: Date,
  horizon: number = PLANNING_HORIZON_DAYS,
): UpcomingDay[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (item.targetDate === null) continue;
    counts.set(item.targetDate, (counts.get(item.targetDate) ?? 0) + 1);
  }

  const days: UpcomingDay[] = [];
  for (let offset = 0; offset < horizon; offset += 1) {
    const date = addDays(now, offset);
    const iso = isoDateOf(date);
    days.push({
      iso,
      day: date.getDate(),
      // getDay() devuelve 0 para domingo; acá la semana empieza el lunes, como el calendario.
      weekday: (date.getDay() + 6) % 7,
      isToday: offset === 0,
      planned: counts.get(iso) ?? 0,
    });
  }

  return days;
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
  const days = upcomingDays(
    items.filter((item) => item.status !== "publicada"),
    now,
    horizon,
  );
  const window = new Set(days.map((day) => day.iso));
  const planned = items.filter(
    (item) => item.status !== "publicada" && item.targetDate !== null && window.has(item.targetDate),
  );

  const rhythm = weeklyRhythm(postedAt, now);
  const expected = rhythm === null ? null : Math.round((rhythm * horizon) / 7);

  return {
    rhythm,
    planned: planned.length,
    withoutScript: planned.filter((item) => !hasScript(item)).length,
    missing: expected === null ? null : Math.max(0, expected - planned.length),
    days,
  };
}

/** Un guion empieza a existir cuando hay hook o desarrollo; el CTA solo no alcanza. */
function hasScript(item: { hook: string; development: string }): boolean {
  return item.hook.trim().length > 0 || item.development.trim().length > 0;
}
