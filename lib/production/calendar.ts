export const CALENDAR_WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"] as const;

export const CALENDAR_MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

/** Grilla de 42 celdas (6 semanas), lunes primero. Devuelve días o null en los huecos. */
export function buildMonthGrid(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7; // lunes primero
  const cells: (number | null)[] = [];

  for (let i = 0; i < offset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length < 42) cells.push(null);

  return cells;
}

/** Fecha local como "YYYY-MM-DD", determinística (sin problemas de timezone). */
export function toISODate(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

/** El día de una fecha, leído en la zona local y no en UTC. */
export function isoDateOf(date: Date): string {
  return toISODate(date.getFullYear(), date.getMonth(), date.getDate());
}

/** "YYYY-MM-DD" de hoy en la zona local. */
export function todayISODate(): string {
  return isoDateOf(new Date());
}

/** La misma hora, tantos días después. Salta bien fin de mes y cambios de horario. */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** "Septiembre 2026" en español. */
export function monthTitle(year: number, month: number): string {
  return `${CALENDAR_MONTHS[month]} ${year}`;
}

/**
 * En qué día del calendario va una pieza.
 *
 * Si ya salió, manda la fecha en que salió: una pieza planificada para el miércoles y
 * publicada el sábado ocurrió el sábado, y ponerla el miércoles sería mostrar el plan
 * como si fuera lo que pasó. Mientras no salga manda la fecha objetivo, que es lo único
 * que hay. Devuelve `null` cuando no tiene ninguna de las dos y por lo tanto no va a
 * ningún día.
 */
export function calendarDateOf(item: {
  publishedAt: string | null;
  targetDate: string | null;
}): string | null {
  if (item.publishedAt !== null) {
    const date = new Date(item.publishedAt);
    if (!Number.isNaN(date.getTime())) return isoDateOf(date);
  }

  return item.targetDate;
}
