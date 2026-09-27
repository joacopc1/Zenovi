import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMediaViewEvolution,
  readMediaViewEvolution,
} from "../lib/content/media-view-evolution.ts";

test("deriva las visualizaciones nuevas entre días consecutivos", () => {
  const points = buildMediaViewEvolution([
    { observedOn: "2026-09-19", value: 124 },
    { observedOn: "2026-09-20", value: 150 },
    { observedOn: "2026-09-21", value: 159 },
  ]);

  assert.deepEqual(points.map((point) => point.views), [null, 26, 9]);
});

test("no atribuye a un solo día lo acumulado durante un hueco", () => {
  const points = buildMediaViewEvolution([
    { observedOn: "2026-09-19", value: 124 },
    { observedOn: "2026-09-21", value: 159 },
  ]);

  assert.deepEqual(points.map((point) => point.views), [null, null]);
});

test("un acumulado que retrocede queda como dato desconocido", () => {
  const points = buildMediaViewEvolution([
    { observedOn: "2026-09-19", value: 124 },
    { observedOn: "2026-09-20", value: 120 },
  ]);

  assert.deepEqual(points.map((point) => point.views), [null, null]);
});

test("una pieza que dejó de sumar se reconoce, con su acumulado", () => {
  // El caso real: el Reel quedó en 124 y no se movió más. La curva sería una línea de
  // ceros que se lee como fracaso.
  const evolution = readMediaViewEvolution([
    { observedOn: "2026-09-24", value: 124 },
    { observedOn: "2026-09-25", value: 124 },
    { observedOn: "2026-09-26", value: 124 },
    { observedOn: "2026-09-27", value: 124 },
  ]);

  assert.equal(evolution.growing, false);
  assert.equal(evolution.total, 124);
  assert.equal(evolution.flatDays, 3, "tres días medidos sin moverse");
  assert.equal(evolution.lastGrowthOn, null);
});

test("una pieza que todavía se mueve se grafica", () => {
  const evolution = readMediaViewEvolution([
    { observedOn: "2026-09-24", value: 100 },
    { observedOn: "2026-09-25", value: 140 },
    { observedOn: "2026-09-26", value: 160 },
  ]);

  assert.equal(evolution.growing, true);
  assert.equal(evolution.total, 160);
  assert.equal(evolution.lastGrowthOn, "2026-09-26");
  assert.equal(evolution.flatDays, 0);
});

test("una pieza que se movió y después se apagó cuenta los días quietos", () => {
  const evolution = readMediaViewEvolution([
    { observedOn: "2026-09-24", value: 100 },
    { observedOn: "2026-09-25", value: 140 },
    { observedOn: "2026-09-26", value: 140 },
    { observedOn: "2026-09-27", value: 140 },
  ]);

  assert.equal(evolution.growing, true, "hubo crecimiento, así que la curva sirve");
  assert.equal(evolution.lastGrowthOn, "2026-09-25");
  assert.equal(evolution.flatDays, 2);
});

test("sin mediciones no se inventa un acumulado", () => {
  const evolution = readMediaViewEvolution([]);

  assert.equal(evolution.total, null);
  assert.equal(evolution.growing, false);
  assert.equal(evolution.flatDays, 0);
  assert.deepEqual(evolution.points, []);
});
