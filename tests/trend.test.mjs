import assert from "node:assert/strict";
import test from "node:test";
import { calculateTrend } from "../components/home/trend.ts";

test("clasifica una mejora con su porcentaje", () => {
  assert.deepEqual(calculateTrend(125, 100, true), {
    direction: "up",
    percentage: 25,
  });
});

test("clasifica una caída con su porcentaje", () => {
  assert.deepEqual(calculateTrend(75, 100, true), {
    direction: "down",
    percentage: -25,
  });
});

test("no inventa una comparación cuando no existe base anterior", () => {
  assert.deepEqual(calculateTrend(20, 0, true), {
    direction: "unavailable",
    percentage: null,
  });
});

test("trata variaciones menores al medio punto como estables", () => {
  assert.deepEqual(calculateTrend(100.4, 100, true), {
    direction: "flat",
    percentage: 0,
  });
});
