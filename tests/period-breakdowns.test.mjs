import assert from "node:assert/strict";
import test from "node:test";
import {
  breakdownMetricKey,
  buildPeriodBreakdowns,
  buildPeriodWindows,
  periodKey,
} from "../lib/data/period-breakdowns.ts";

const END = "2026-09-15T00:00:00.000Z";

function row(metric, value, period = periodKey(30), synced_at = "2026-09-15T10:00:00Z", end_time = END) {
  return { metric, value, period, end_time, synced_at };
}

test("las ventanas terminan en la última medianoche: sólo días cerrados", () => {
  const windows = buildPeriodWindows(new Date("2026-09-15T17:30:00Z"));

  assert.deepEqual(windows.map(({ days }) => days), [7, 30, 90]);
  assert.equal(windows[1].end, END);
  assert.equal(windows[1].until - windows[1].since, 30 * 24 * 60 * 60);
});

test("agrupa post y carrusel como publicaciones, igual que Instagram", () => {
  // Datos reales de @elcostarrica: Instagram muestra Publicaciones 35 = 25 + 10.
  const [breakdown] = buildPeriodBreakdowns([
    row(breakdownMetricKey("views", "media_product_type", "REEL"), 124),
    row(breakdownMetricKey("views", "media_product_type", "POST"), 25),
    row(breakdownMetricKey("views", "media_product_type", "CAROUSEL_CONTAINER"), 10),
    row(breakdownMetricKey("views", "media_product_type", "STORY"), 8),
  ]);

  assert.deepEqual(breakdown.viewsByContent, [
    { type: "reels", value: 124 },
    { type: "posts", value: 35 },
    { type: "stories", value: 8 },
  ]);
});

test("un tipo desconocido cae en otros y sólo aparece si tiene valor", () => {
  const [breakdown] = buildPeriodBreakdowns([
    row(breakdownMetricKey("views", "media_product_type", "REEL"), 5),
    row(breakdownMetricKey("views", "media_product_type", "AD"), 2),
  ]);

  assert.deepEqual(breakdown.viewsByContent.at(-1), { type: "other", value: 2 });
});

test("lee alcance y reparto de seguidores con el rango de días medido", () => {
  const [breakdown] = buildPeriodBreakdowns([
    row("reach", 105),
    row(breakdownMetricKey("views", "follow_type", "FOLLOWER"), 46),
    row(breakdownMetricKey("views", "follow_type", "NON_FOLLOWER"), 121),
  ]);

  assert.equal(breakdown.reach, 105);
  assert.deepEqual(breakdown.viewsByAudience, { followers: 46, nonFollowers: 121 });
  assert.equal(breakdown.fromDate, "2026-08-16");
  assert.equal(breakdown.toDate, "2026-09-14");
});

test("Meta omite la parte en cero: la que falta vale cero", () => {
  // Caso real de @elcostarrica en 7 días: las 24 visualizaciones fueron de seguidores.
  const [breakdown] = buildPeriodBreakdowns([row(breakdownMetricKey("views", "follow_type", "FOLLOWER"), 24)]);

  assert.deepEqual(breakdown.viewsByAudience, { followers: 24, nonFollowers: 0 });
});

test("sin ninguna parte no afirma un reparto de seguidores", () => {
  const [breakdown] = buildPeriodBreakdowns([row("reach", 2)]);

  assert.equal(breakdown.viewsByAudience, null);
});

test("usa sólo la sincronización más reciente de cada ventana", () => {
  const [breakdown] = buildPeriodBreakdowns([
    row("reach", 90, periodKey(30), "2026-09-14T10:00:00Z", "2026-09-14T00:00:00.000Z"),
    row("reach", 105, periodKey(30), "2026-09-15T10:00:00Z"),
  ]);

  assert.equal(breakdown.reach, 105);
  assert.equal(breakdown.toDate, "2026-09-14");
});

test("no inventa ventanas sin datos", () => {
  assert.deepEqual(buildPeriodBreakdowns([row("reach", 2, periodKey(7))]).map(({ days }) => days), [7]);
});
