import assert from "node:assert/strict";
import test from "node:test";
import {
  BACKFILL_DAYS_PER_RUN,
  endOfDay,
  findMissingDailyWindows,
} from "../lib/meta/daily-backfill.ts";

const now = new Date("2026-09-12T17:00:00Z");

test("no pide el día en curso, que todavía se está acumulando", () => {
  const [first] = findMissingDailyWindows({ knownEndTimes: [], now, lookbackDays: 90 });

  assert.equal(first.end.slice(0, 10), "2026-09-12");
  assert.equal(first.until - first.since, 24 * 60 * 60, "la ventana cubre un día exacto");
});

test("empieza por lo más reciente", () => {
  const windows = findMissingDailyWindows({ knownEndTimes: [], now, lookbackDays: 90, limit: 3 });

  assert.deepEqual(
    windows.map((window) => window.end.slice(0, 10)),
    ["2026-09-12", "2026-09-11", "2026-09-10"],
  );
});

test("saltea los días que ya tienen valor guardado", () => {
  const windows = findMissingDailyWindows({
    knownEndTimes: ["2026-09-11T00:00:00.000Z", "2026-09-10T07:00:00.000Z"],
    now,
    lookbackDays: 90,
    limit: 3,
  });

  assert.deepEqual(
    windows.map((window) => window.end.slice(0, 10)),
    ["2026-09-12", "2026-09-09", "2026-09-08"],
  );
});

test("compara por día aunque la hora guardada no sea medianoche UTC", () => {
  // Meta informa el fin del día en el huso de la cuenta, así que llega como 07:00Z.
  const windows = findMissingDailyWindows({
    knownEndTimes: ["2026-09-12T07:00:00.000Z"],
    now,
    lookbackDays: 90,
    limit: 1,
  });

  assert.equal(windows[0].end.slice(0, 10), "2026-09-11", "no vuelve a pedir ese día");
});

test("limita cuántos días rellena por corrida", () => {
  const windows = findMissingDailyWindows({ knownEndTimes: [], now, lookbackDays: 90 });

  assert.equal(windows.length, BACKFILL_DAYS_PER_RUN);
});

test("no devuelve nada cuando el período ya está completo", () => {
  const known = Array.from({ length: 95 }, (_, index) =>
    new Date(Date.UTC(2026, 8, 12) - index * 24 * 60 * 60 * 1000).toISOString(),
  );

  assert.deepEqual(findMissingDailyWindows({ knownEndTimes: known, now, lookbackDays: 90 }), []);
});

test("fecha la foto de hoy al cierre del día en curso", () => {
  assert.equal(endOfDay(new Date("2026-09-12T17:00:00Z")), "2026-09-13T00:00:00.000Z");
});

test("dos sincronizaciones del mismo día producen la misma fecha", () => {
  assert.equal(
    endOfDay(new Date("2026-09-12T00:30:00Z")),
    endOfDay(new Date("2026-09-12T23:30:00Z")),
  );
});
