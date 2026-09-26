import assert from "node:assert/strict";
import test from "node:test";
import {
  addDays,
  buildMonthGrid,
  calendarDateOf,
  isoDateOf,
  monthTitle,
  toISODate,
  todayISODate,
} from "../lib/production/calendar.ts";

test("toISODate formatea sin problemas de timezone", () => {
  assert.equal(toISODate(2026, 8, 24), "2026-09-24");
  assert.equal(toISODate(2026, 0, 5), "2026-01-05");
});

test("buildMonthGrid arranca en lunes y cubre 42 celdas", () => {
  // Septiembre 2026 empieza en martes (getDay=2 -> offset=1 con lunes primero).
  const grid = buildMonthGrid(2026, 8);

  assert.equal(grid.length, 42);
  assert.equal(grid[0], null);
  assert.equal(grid[1], 1);
  assert.equal(grid[30], 30); // 30 de septiembre
});

test("buildMonthGrid rellena huecos al final", () => {
  const grid = buildMonthGrid(2026, 8);
  assert.equal(grid[30], 30);
  assert.equal(grid[31], null); // 30 sep es el último día de septiembre
});

test("monthTitle devuelve mes y año en español", () => {
  assert.equal(monthTitle(2026, 8), "Septiembre 2026");
  assert.equal(monthTitle(2026, 0), "Enero 2026");
});

test("todayISODate devuelve YYYY-MM-DD", () => {
  assert.match(todayISODate(), /^\d{4}-\d{2}-\d{2}$/);
});

test("una pieza publicada va el día que salió, no el que se planificó", () => {
  // Planificada para el 23 y publicada el 26: ocurrió el 26.
  assert.equal(
    calendarDateOf({ publishedAt: "2026-09-26T15:00:00Z", targetDate: "2026-09-23" }),
    isoDateOf(new Date("2026-09-26T15:00:00Z")),
  );
});

test("una pieza sin publicar va en su fecha objetivo", () => {
  assert.equal(calendarDateOf({ publishedAt: null, targetDate: "2026-09-23" }), "2026-09-23");
});

test("sin ninguna de las dos fechas no va a ningún día", () => {
  assert.equal(calendarDateOf({ publishedAt: null, targetDate: null }), null);
});

test("una fecha de publicación rota cae de vuelta en la objetivo", () => {
  assert.equal(calendarDateOf({ publishedAt: "ayer", targetDate: "2026-09-23" }), "2026-09-23");
});

test("addDays salta bien el fin de mes", () => {
  assert.equal(isoDateOf(addDays(new Date(2026, 8, 30), 1)), "2026-10-01");
  assert.equal(isoDateOf(addDays(new Date(2026, 0, 1), -1)), "2025-12-31");
});
