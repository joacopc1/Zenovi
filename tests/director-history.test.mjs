import assert from "node:assert/strict";
import test from "node:test";
import { hasAnswerText, historyForModel } from "../lib/director/history.ts";

test("el razonamiento de turnos anteriores no se reenvía, lo dicho sí", () => {
  const history = historyForModel([
    { id: "u1", role: "user", parts: [{ type: "text", text: "Hola" }] },
    { id: "a1", role: "assistant", parts: [{ type: "step-start" }, { type: "reasoning", text: "pienso…" }, { type: "text", text: "¡Hola!" }] },
  ]);
  assert.deepEqual(history.at(1).parts.map((part) => part.type), ["step-start", "text"]);
  assert.equal(history.at(0).parts.at(0).text, "Hola");
});

test("una respuesta vacía o que falló no cuenta como respuesta", () => {
  assert.equal(hasAnswerText({ id: "a", role: "assistant", parts: [] }), false);
  assert.equal(hasAnswerText({ id: "a", role: "assistant", parts: [{ type: "reasoning", text: "x" }, { type: "text", text: "  " }] }), false);
  assert.equal(hasAnswerText({ id: "a", role: "assistant", parts: [{ type: "text", text: "Listo" }] }), true);
});
