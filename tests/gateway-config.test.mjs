import assert from "node:assert/strict";
import test from "node:test";
import { gatewayModelCandidates } from "../lib/ai/gateway-config.ts";

test("el respaldo externo usa proveedores distintos", () => {
  assert.deepEqual(gatewayModelCandidates(), [
    "anthropic/claude-sonnet-4.6",
    "openai/gpt-5.4",
  ]);
});

test("permite configurar la cadena sin repetir modelos", () => {
  assert.deepEqual(gatewayModelCandidates("openai/gpt-5.4", "openai/gpt-5.4"), [
    "openai/gpt-5.4",
  ]);
});
