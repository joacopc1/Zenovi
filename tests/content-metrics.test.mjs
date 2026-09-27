import assert from "node:assert/strict";
import test from "node:test";
import {
  benchmarkDifference,
  getContentBenchmark,
  getEngagementRate,
  getPerformanceSignal,
  getWatchRetentionPercentage,
} from "../lib/content/metrics.ts";

test("engagement usa interacciones sobre visualizaciones", () => {
  assert.equal(getEngagementRate(94, 1000), 9.4);
  assert.equal(getEngagementRate(null, 1000), null);
  assert.equal(getEngagementRate(10, 0), null);
});

test("retención compara el tiempo medio contra la duración real", () => {
  assert.equal(getWatchRetentionPercentage(15_000, 60), 25);
  assert.equal(getWatchRetentionPercentage(null, 60), null);
  assert.equal(getWatchRetentionPercentage(15_000, null), null);
});

test("la señal de rendimiento usa una única banda compartida", () => {
  assert.equal(getPerformanceSignal(1.2), "up");
  assert.equal(getPerformanceSignal(0.8), "down");
  assert.equal(getPerformanceSignal(1), "right");
  assert.equal(getPerformanceSignal(null), "right");
});

test("el benchmark usa la mediana del formato", () => {
  const cohort = [item("a", 100), item("b", 200), item("c", 900)];

  assert.deepEqual(getContentBenchmark(cohort, "c", "views"), {
    current: 900,
    median: 200,
    multiplier: 4.5,
    sampleSize: 3,
  });
});

test("el benchmark no afirma nada con menos de tres piezas", () => {
  assert.equal(getContentBenchmark([item("a", 100), item("b", 200)], "a", "views"), null);
});

function item(id, views) {
  return {
    id,
    kind: "reel",
    formatLabel: "Reel",
    caption: null,
    thumbnailUrl: null,
    mediaUrl: null,
    permalink: null,
    postedAt: "2026-09-10T12:00:00Z",
    dateLabel: "10 sept 2026",
    relativeDateLabel: "Hoy",
    likes: 10,
    comments: 2,
    views,
    reach: views,
    interactions: 20,
    saves: 5,
    shares: 3,
    averageWatchTimeMs: 10_000,
    totalWatchTimeMs: 100_000,
    skipRate: 20,
  };
}

test("la diferencia contra lo habitual se lee en por ciento", () => {
  // "57% más alto" se entiende sin traducir; "×1,57" hay que pensarlo.
  assert.equal(benchmarkDifference({ current: 3.06, median: 1.95, multiplier: 3.06 / 1.95, sampleSize: 5 }), 57);
  assert.equal(benchmarkDifference({ current: 1.12, median: 1.42, multiplier: 1.12 / 1.42, sampleSize: 5 }), -21);
  assert.equal(benchmarkDifference({ current: 2, median: 2, multiplier: 1, sampleSize: 5 }), 0);
});

test("sin base para comparar no hay diferencia que informar", () => {
  assert.equal(benchmarkDifference({ current: 3, median: 0, multiplier: null, sampleSize: 5 }), null);
});

test("las cuatro acciones se comparan como proporción de las vistas", () => {
  // Un Reel con el triple de vistas junta más guardados sin que nadie lo haya guardado más.
  const cohort = [
    { id: "a", kind: "reel", views: 100, likes: 10, comments: 2, saves: 4, shares: 1, interactions: 17 },
    { id: "b", kind: "reel", views: 1000, likes: 100, comments: 20, saves: 40, shares: 10, interactions: 170 },
    { id: "c", kind: "reel", views: 200, likes: 40, comments: 4, saves: 8, shares: 2, interactions: 54 },
  ];

  const likesB = getContentBenchmark(cohort, "b", "likes");
  const likesC = getContentBenchmark(cohort, "c", "likes");

  assert.equal(likesB.current, 10, "10% de sus vistas, aunque sean 100 me gusta");
  assert.equal(likesC.current, 20, "20% de sus vistas con sólo 40 me gusta");
  assert.ok(likesC.multiplier > likesB.multiplier, "la que gustó más en proporción gana");
});
