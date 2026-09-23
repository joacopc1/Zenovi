import assert from "node:assert/strict";
import test from "node:test";
import {
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
