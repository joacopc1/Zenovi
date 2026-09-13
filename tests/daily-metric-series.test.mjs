import assert from "node:assert/strict";
import test from "node:test";
import { buildDailyMetricSeries } from "../lib/data/daily-metric-series.ts";

const now = new Date("2026-09-11T20:00:00Z");

test("deja en null los días que Instagram no informó", () => {
  const series = buildDailyMetricSeries(
    [{ metric: "reach", end_time: "2026-09-11T00:00:00Z", value: 120 }],
    now,
    3,
  );

  assert.equal(series.length, 3);
  assert.deepEqual(
    series.map(({ reach }) => reach),
    [null, null, 120],
  );
});

test("no confunde un cero informado con un día ausente", () => {
  const series = buildDailyMetricSeries(
    [{ metric: "reach", end_time: "2026-09-11T00:00:00Z", value: 0 }],
    now,
    2,
  );

  assert.equal(series[0].reach, null, "el día sin fila queda sin dato");
  assert.equal(series[1].reach, 0, "el cero informado se conserva como cero");
});

test("conserva todos los días del período aunque falten datos", () => {
  const series = buildDailyMetricSeries([], now, 90);

  assert.equal(series.length, 90);
  assert.ok(series.every(({ reach, views, interactions }) =>
    reach === null && views === null && interactions === null));
});

test("mapea cada métrica de Instagram a su campo de la serie", () => {
  const series = buildDailyMetricSeries(
    [
      { metric: "views", end_time: "2026-09-11T00:00:00Z", value: 10 },
      { metric: "reach", end_time: "2026-09-11T00:00:00Z", value: 20 },
      { metric: "total_interactions", end_time: "2026-09-11T00:00:00Z", value: 30 },
    ],
    now,
    1,
  );

  assert.deepEqual(
    { views: series[0].views, reach: series[0].reach, interactions: series[0].interactions },
    { views: 10, reach: 20, interactions: 30 },
  );
});

test("ignora métricas desconocidas y fechas inválidas", () => {
  const series = buildDailyMetricSeries(
    [
      { metric: "follower_count", end_time: "2026-09-11T00:00:00Z", value: 99 },
      { metric: "reach", end_time: "no-es-una-fecha", value: 99 },
    ],
    now,
    1,
  );

  assert.equal(series[0].reach, null);
});
