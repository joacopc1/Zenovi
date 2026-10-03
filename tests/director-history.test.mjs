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
  assert.equal(hasAnswerText({ id: "a", role: "assistant", parts: [{ type: "tool-proponer_idea", toolCallId: "t" }] }), true);
});

test("el final de la conversación queda marcado para la caché, sin tocar lo demás", async () => {
  const { withCachedHistory } = await import("../lib/director/history.ts");
  const marked = withCachedHistory([
    { role: "user", content: "Hola" },
    { role: "assistant", content: "¡Hola!" },
    { role: "user", content: "¿Qué publico hoy?", providerOptions: { otro: { x: 1 } } },
  ]);
  assert.equal(marked.length, 3);
  assert.equal(marked[0].providerOptions, undefined);
  assert.deepEqual(marked[2].providerOptions, { otro: { x: 1 }, anthropic: { cacheControl: { type: "ephemeral" } } });
  assert.deepEqual(withCachedHistory([]), []);
});

test("una respuesta cortada por el filtro de seguridad queda con la frase de rechazo", async () => {
  const { withRefusalAnswer, hasAnswerText, REFUSAL_ANSWER } = await import("../lib/director/history.ts");
  const refused = withRefusalAnswer({ id: "a", role: "assistant", parts: [] });
  assert.equal(refused.id, "a");
  assert.equal(hasAnswerText(refused), true);
  assert.equal(refused.parts[0].text, REFUSAL_ANSWER);
});
