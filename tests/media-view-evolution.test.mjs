import assert from "node:assert/strict";
import test from "node:test";
import { buildMediaViewEvolution } from "../lib/content/media-view-evolution.ts";

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
