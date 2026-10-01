import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyGeminiFailure,
  classifyGroqFailure,
  parseRetryAfterMs,
  userMessageForAiFailure,
} from "../lib/ai/provider-error.ts";

test("distingue un límite temporal de una cuota agotada", () => {
  const temporary = classifyGeminiFailure(429, {
    error: { status: "RESOURCE_EXHAUSTED", message: "Too many requests. Try again later." },
  });
  const quota = classifyGeminiFailure(429, {
    error: { status: "RESOURCE_EXHAUSTED", message: "Quota exceeded for requests per day." },
  });

  assert.equal(temporary.kind, "rate_limit");
  assert.equal(temporary.retryable, true);
  assert.equal(quota.kind, "quota_exhausted");
  assert.equal(quota.retryable, false);
});

test("reconoce autenticación, solicitudes inválidas y fallos pasajeros", () => {
  assert.equal(classifyGeminiFailure(401, {}).kind, "authentication");
  assert.equal(classifyGeminiFailure(400, {}).kind, "invalid_request");
  assert.equal(classifyGeminiFailure(408, {}).kind, "timeout");
  assert.equal(classifyGeminiFailure(503, {}).kind, "unavailable");
});

test("Groq comparte la clasificación sin perder la procedencia", () => {
  const failure = classifyGroqFailure(429, {
    error: { type: "rate_limit_exceeded", message: "Too many requests" },
  });

  assert.equal(failure.provider, "groq");
  assert.equal(failure.kind, "rate_limit");
  assert.equal(failure.retryable, true);
});

test("lee Retry-After en segundos y descarta valores inválidos", () => {
  assert.equal(parseRetryAfterMs("7"), 7_000);
  assert.equal(parseRetryAfterMs("0"), 0);
  assert.equal(parseRetryAfterMs("nope"), null);
  assert.equal(parseRetryAfterMs(null), null);
});

test("el mensaje de cuota no invita a reintentar inmediatamente", () => {
  const failure = classifyGeminiFailure(429, {
    error: { type: "quota_exceeded", message: "Daily quota exceeded" },
  });
  const message = userMessageForAiFailure(failure, "el análisis");

  assert.match(message, /cuota/i);
  assert.doesNotMatch(message, /un minuto/i);
});
