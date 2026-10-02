import assert from "node:assert/strict";
import test from "node:test";
import { addMeteredUsage, meterAiUsage } from "../lib/credits/usage-meter.ts";

const usage = (inputTokens, outputTokens) => ({ inputTokens, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens });

test("mide todas las llamadas de una operación, aunque vengan de proveedores distintos", async () => {
  const { value, costUsd, unpricedModels } = await meterAiUsage(async () => {
    addMeteredUsage("gemini-3.8-flash", usage(1_000_000, 0));
    await Promise.resolve();
    addMeteredUsage("claude-sonnet-5-5", usage(0, 100_000));
    return "listo";
  });
  assert.equal(value, "listo");
  assert.equal(costUsd, 0.75 + 1);
  assert.deepEqual(unpricedModels, []);
});

test("dos operaciones a la vez no se mezclan los costos", async () => {
  const [left, right] = await Promise.all([
    meterAiUsage(async () => { await new Promise((resolve) => setTimeout(resolve, 5)); addMeteredUsage("gemini-3.8-flash", usage(1_000_000, 0)); }),
    meterAiUsage(async () => { addMeteredUsage("gemini-3.8-flash", usage(0, 1_000_000)); }),
  ]);
  assert.equal(left.costUsd, 0.75);
  assert.equal(right.costUsd, 3.75);
});

test("un modelo sin precio no corta la operación: queda anotado", async () => {
  const { costUsd, unpricedModels } = await meterAiUsage(async () => addMeteredUsage("gemini-9", usage(10, 10)));
  assert.equal(costUsd, 0);
  assert.deepEqual(unpricedModels, ["gemini-9"]);
});

test("fuera de una medición, anotar no hace nada", () => {
  assert.doesNotThrow(() => addMeteredUsage("gemini-3.8-flash", usage(10, 10)));
});
