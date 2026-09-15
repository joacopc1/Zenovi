import assert from "node:assert/strict";
import test from "node:test";
import {
  BACKFILL_REQUESTS_PER_RUN,
  endOfDay,
  planDailyBackfill,
} from "../lib/meta/daily-backfill.ts";

const now = new Date("2026-09-12T17:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;

function days(plan) {
  return plan.map(({ window }) => window.end.slice(0, 10));
}

test("no pide el día en curso, que todavía se está acumulando", () => {
  const [first] = planDailyBackfill({
    knownEndTimesByMetric: new Map(),
    now,
    lookbackDays: 90,
    metrics: ["views"],
  });

  assert.equal(first.window.end.slice(0, 10), "2026-09-12");
  assert.equal(first.window.until - first.window.since, 24 * 60 * 60, "la ventana cubre un día exacto");
});

test("empieza por lo más reciente", () => {
  const plan = planDailyBackfill({
    knownEndTimesByMetric: new Map(),
    now,
    lookbackDays: 90,
    metrics: ["views"],
    budget: 3,
  });

  assert.deepEqual(days(plan), ["2026-09-12", "2026-09-11", "2026-09-10"]);
});

test("saltea los días que esa métrica ya tiene guardados", () => {
  const plan = planDailyBackfill({
    knownEndTimesByMetric: new Map([
      ["views", ["2026-09-11T00:00:00.000Z", "2026-09-10T07:00:00.000Z"]],
    ]),
    now,
    lookbackDays: 90,
    metrics: ["views"],
    budget: 3,
  });

  assert.deepEqual(days(plan), ["2026-09-12", "2026-09-09", "2026-09-08"]);
});

test("cada métrica lleva su propia cuenta de días", () => {
  // views ya tiene el día; me gusta no, y tiene que pedirse igual.
  const plan = planDailyBackfill({
    knownEndTimesByMetric: new Map([["views", ["2026-09-12T00:00:00.000Z"]]]),
    now,
    lookbackDays: 1,
    metrics: ["views", "likes"],
  });

  assert.deepEqual(plan.map(({ metric }) => metric), ["likes"]);
});

test("compara por día aunque la hora guardada no sea medianoche UTC", () => {
  // Meta informa el fin del día en el huso de la cuenta, así que llega como 07:00Z.
  const plan = planDailyBackfill({
    knownEndTimesByMetric: new Map([["views", ["2026-09-12T07:00:00.000Z"]]]),
    now,
    lookbackDays: 90,
    metrics: ["views"],
    budget: 1,
  });

  assert.equal(plan[0].window.end.slice(0, 10), "2026-09-11", "no vuelve a pedir ese día");
});

test("completa los días recientes de todas las métricas antes que los viejos", () => {
  const plan = planDailyBackfill({
    knownEndTimesByMetric: new Map(),
    now,
    lookbackDays: 90,
    metrics: ["views", "likes"],
    budget: 4,
  });

  assert.deepEqual(
    plan.map(({ metric, window }) => `${window.end.slice(0, 10)} ${metric}`),
    ["2026-09-12 views", "2026-09-12 likes", "2026-09-11 views", "2026-09-11 likes"],
  );
});

test("respeta el tope de llamadas por corrida", () => {
  const plan = planDailyBackfill({ knownEndTimesByMetric: new Map(), now, lookbackDays: 90 });

  assert.equal(plan.length, BACKFILL_REQUESTS_PER_RUN);
});

test("no devuelve nada cuando todas las métricas tienen el período completo", () => {
  const known = Array.from({ length: 95 }, (_, index) =>
    new Date(Date.UTC(2026, 8, 12) - index * DAY_MS).toISOString(),
  );

  assert.deepEqual(
    planDailyBackfill({
      knownEndTimesByMetric: new Map([["views", known], ["likes", known]]),
      now,
      lookbackDays: 90,
      metrics: ["views", "likes"],
    }),
    [],
  );
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
