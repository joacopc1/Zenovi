import assert from "node:assert/strict";
import test from "node:test";
import { isAnalysisJobStatus, readAnalysisState } from "../lib/content/analysis.ts";

const fila = (overrides = {}) => ({
  status: "queued",
  result: null,
  failureReason: null,
  canRetry: true,
  startedAt: null,
  ...overrides,
});

test("sin fila, la pieza todavía no se pidió", () => {
  assert.deepEqual(readAnalysisState(null), { status: "not_requested" });
});

test("en cola y corriendo conservan cuándo empezó", () => {
  const enCola = readAnalysisState(fila({ startedAt: "2026-09-27T10:00:00Z" }));

  assert.equal(enCola.status, "queued");
  assert.equal(enCola.startedAt, "2026-09-27T10:00:00Z");
  assert.equal(readAnalysisState(fila({ status: "running" })).status, "running");
});

test("un análisis listo devuelve su resultado", () => {
  const state = readAnalysisState(
    fila({ status: "ready", result: { summary: "Anda bien", pipelineVersion: "1" } }),
  );

  assert.equal(state.status, "ready");
  assert.equal(state.analysis.summary, "Anda bien");
});

test("listo sin resultado se trata como falla, no rompe la pantalla", () => {
  // La base lo impide con un check, pero la lectura no puede dar por hecho que nadie
  // escribió la fila por otro camino.
  const state = readAnalysisState(fila({ status: "ready", result: null }));

  assert.equal(state.status, "failed");
  assert.equal(state.canRetry, true);
});

test("un fallo lleva su motivo y si se puede reintentar", () => {
  const state = readAnalysisState(
    fila({ status: "failed", failureReason: "El video ya no está disponible.", canRetry: false }),
  );

  assert.equal(state.status, "failed");
  assert.equal(state.reason, "El video ya no está disponible.");
  assert.equal(state.canRetry, false);
});

test("un fallo sin motivo igual dice algo", () => {
  const state = readAnalysisState(fila({ status: "failed" }));

  assert.equal(state.status, "failed");
  assert.ok(state.reason.length > 0);
});

test("un estado que la app no conoce no rompe la pantalla", () => {
  const state = readAnalysisState(fila({ status: "pensando" }));

  assert.equal(state.status, "failed");
  assert.equal(state.canRetry, true);
});

test("isAnalysisJobStatus rechaza lo que no conoce", () => {
  assert.equal(isAnalysisJobStatus("running"), true);
  assert.equal(isAnalysisJobStatus("pensando"), false);
  assert.equal(isAnalysisJobStatus(null), false);
});
