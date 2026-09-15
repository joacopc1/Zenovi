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
      { metric: "accounts_engaged", end_time: "2026-09-11T00:00:00Z", value: 99 },
      { metric: "reach", end_time: "no-es-una-fecha", value: 99 },
    ],
    now,
    1,
  );

  assert.equal(series[0].reach, null);
});

test("ubica cada fila en el día que mide, no en su fecha de cierre", () => {
  // Meta fecha el día por su cierre en el huso de la cuenta: 07:00Z del 11 cierra el 10.
  const series = buildDailyMetricSeries(
    [{ metric: "reach", end_time: "2026-09-11T07:00:00Z", value: 5 }],
    now,
    2,
  );

  assert.deepEqual(series.map(({ date }) => date), ["2026-09-09", "2026-09-10"]);
  assert.equal(series[1].reach, 5);
});

test("la serie termina ayer: el día en curso todavía no cerró", () => {
  const series = buildDailyMetricSeries([], now, 1);

  assert.equal(series[0].date, "2026-09-10");
});

test("mapea las métricas de engagement y de perfil", () => {
  const end = "2026-09-11T00:00:00Z";
  const [day] = buildDailyMetricSeries(
    [
      { metric: "likes", end_time: end, value: 1 },
      { metric: "comments", end_time: end, value: 2 },
      { metric: "shares", end_time: end, value: 3 },
      { metric: "saves", end_time: end, value: 4 },
      { metric: "profile_views", end_time: end, value: 5 },
      { metric: "profile_links_taps", end_time: end, value: 6 },
    ],
    now,
    1,
  );

  assert.deepEqual(
    [day.likes, day.comments, day.shares, day.saves, day.profileViews, day.linkTaps],
    [1, 2, 3, 4, 5, 6],
  );
});

test("los seguidores son una foto: no se suman dentro del día", () => {
  const end = "2026-09-11T00:00:00Z";
  const [day] = buildDailyMetricSeries(
    [
      { metric: "follower_count", end_time: end, value: 30 },
      { metric: "follower_count", end_time: end, value: 31 },
    ],
    now,
    1,
  );

  assert.equal(day.followers, 31);
});
