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

/** "YYYY-MM-DD" de hoy en la zona local. */
export function todayISODate(): string {
  const now = new Date();
  return toISODate(now.getFullYear(), now.getMonth(), now.getDate());
}

/** "Septiembre 2026" en español. */
export function monthTitle(year: number, month: number): string {
  return `${CALENDAR_MONTHS[month]} ${year}`;
}
