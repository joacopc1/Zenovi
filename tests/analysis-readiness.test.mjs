import assert from "node:assert/strict";
import test from "node:test";
import { reelAnalysisBlocker, storyAnalysisBlocker } from "../lib/content/analysis-readiness.ts";

const now = new Date("2026-10-03T12:00:00Z");
const sequence = (endedAt, reach) => ({ endedAt, stories: [{ reach }] });

test("no deja analizar un Reel que casi nadie vio", () => {
  assert.match(reelAnalysisBlocker(1), /100 visualizaciones/);
  assert.match(reelAnalysisBlocker(null), /100 visualizaciones/);
  assert.equal(reelAnalysisBlocker(100), null);
});

test("no deja analizar una secuencia con Historias todavía vivas", () => {
  assert.match(storyAnalysisBlocker(sequence("2026-10-03T00:00:00Z", 500), now), /24 h/);
});

test("no deja analizar una secuencia que vieron menos de 50 personas", () => {
  assert.match(storyAnalysisBlocker(sequence("2026-10-01T12:00:00Z", 1), now), /50 personas/);
  assert.match(storyAnalysisBlocker(sequence("2026-10-01T12:00:00Z", null), now), /50 personas/);
});

test("deja analizar una secuencia terminada con audiencia suficiente", () => {
  assert.equal(storyAnalysisBlocker(sequence("2026-10-01T12:00:00Z", 50), now), null);
});
