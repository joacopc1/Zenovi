import assert from "node:assert/strict";
import test from "node:test";
import {
  ACCOUNT_CURRENT_TOTAL_PERIOD,
  ACCOUNT_PREVIOUS_TOTAL_PERIOD,
  buildAccountMetricSummaries,
} from "../lib/data/account-metric-summaries.ts";

test("empareja el período anterior de la misma sincronización", () => {
  const summaries = buildAccountMetricSummaries([
    row("reach", ACCOUNT_CURRENT_TOTAL_PERIOD, 14, "2026-09-11T20:00:00Z"),
    row("reach", ACCOUNT_PREVIOUS_TOTAL_PERIOD, 7, "2026-09-11T20:00:00Z"),
  ]);

  assert.deepEqual(summaries, [{ metric: "reach", current: 14, previous: 7 }]);
});

test("no reutiliza una comparación vieja cuando Meta omite el período anterior", () => {
  const summaries = buildAccountMetricSummaries([
    row("views", ACCOUNT_CURRENT_TOTAL_PERIOD, 18, "2026-09-11T20:00:00Z"),
    row("views", ACCOUNT_PREVIOUS_TOTAL_PERIOD, 20, "2026-09-10T20:00:00Z"),
  ]);

  assert.deepEqual(summaries, [{ metric: "views", current: 18, previous: null }]);
});

function row(metric, period, value, synced_at) {
  return { metric, period, value, synced_at };
}
