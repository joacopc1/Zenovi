import assert from "node:assert/strict";
import test from "node:test";
import { RATE_LIMITS, rateLimitKey } from "../lib/security/rate-limit-rules.ts";

test("cada límite separa la operación de quién la hace", () => {
  assert.equal(rateLimitKey("director_chat", "persona-1"), "director_chat:persona-1");
  assert.notEqual(rateLimitKey("director_chat", "a"), rateLimitKey("ai_action", "a"));
});

test("los límites dejan pasar el uso normal de una persona", () => {
  for (const [rule, { limit, windowSeconds }] of Object.entries(RATE_LIMITS)) {
    assert.ok(limit >= 6, `${rule}: muy bajo para una persona`);
    assert.ok(windowSeconds >= 60 && windowSeconds <= 3600, `${rule}: ventana fuera de rango`);
  }
  // Un chat real: unos 20 mensajes en un minuto es el techo, no el uso habitual.
  assert.equal(RATE_LIMITS.director_chat.limit, 20);
});
