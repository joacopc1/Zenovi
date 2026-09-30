import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_MEDIA_DURATION_MS,
  durationMsFromSeconds,
  durationSecondsFromMs,
} from "../lib/content/media-duration.ts";

test("convierte segundos fraccionarios a milisegundos persistibles", () => {
  assert.equal(durationMsFromSeconds(89.423), 89_423);
  assert.equal(durationSecondsFromMs(89_423), 89.423);
});

test("rechaza duraciones ausentes, negativas, infinitas o desmedidas", () => {
  assert.equal(durationMsFromSeconds(null), null);
  assert.equal(durationMsFromSeconds(0), null);
  assert.equal(durationMsFromSeconds(-1), null);
  assert.equal(durationMsFromSeconds(Number.POSITIVE_INFINITY), null);
  assert.equal(durationMsFromSeconds(MAX_MEDIA_DURATION_MS / 1000 + 1), null);
});

test("no usa valores persistidos corruptos en la interfaz", () => {
  assert.equal(durationSecondsFromMs(1.5), null);
  assert.equal(durationSecondsFromMs(MAX_MEDIA_DURATION_MS + 1), null);
});
