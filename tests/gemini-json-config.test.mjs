import assert from "node:assert/strict";
import test from "node:test";
import {
  GEMINI_TEXT_TIMEOUT_MS,
  GEMINI_VIDEO_TIMEOUT_MS,
  geminiModelCandidates,
  retryDelayMs,
} from "../lib/ai/gemini-json.ts";

test("el video tiene más margen que una clasificación de texto", () => {
  assert.equal(GEMINI_TEXT_TIMEOUT_MS, 45_000);
  assert.equal(GEMINI_VIDEO_TIMEOUT_MS, 150_000);
  assert.ok(GEMINI_VIDEO_TIMEOUT_MS > GEMINI_TEXT_TIMEOUT_MS);
});

test("usa un modelo estable distinto como respaldo", () => {
  assert.deepEqual(geminiModelCandidates("gemini-3.8-flash", undefined), [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
  ]);
  assert.deepEqual(geminiModelCandidates("gemini-3.8-flash", "gemini-3.8-flash"), [
    "gemini-3.8-flash",
  ]);
});

test("respeta Retry-After sin bloquear más de quince segundos", () => {
  assert.equal(retryDelayMs(1, 7_000), 7_000);
  assert.equal(retryDelayMs(1, 60_000), 15_000);
});
