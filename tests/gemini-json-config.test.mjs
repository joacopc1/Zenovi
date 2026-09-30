import assert from "node:assert/strict";
import test from "node:test";
import {
  GEMINI_TEXT_TIMEOUT_MS,
  GEMINI_VIDEO_TIMEOUT_MS,
} from "../lib/ai/gemini-json.ts";

test("el video tiene más margen que una clasificación de texto", () => {
  assert.equal(GEMINI_TEXT_TIMEOUT_MS, 45_000);
  assert.equal(GEMINI_VIDEO_TIMEOUT_MS, 150_000);
  assert.ok(GEMINI_VIDEO_TIMEOUT_MS > GEMINI_TEXT_TIMEOUT_MS);
});
