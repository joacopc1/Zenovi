import assert from "node:assert/strict";
import test from "node:test";
import { formatMoment, formatSpan } from "../lib/content/analysis.ts";

test("un momento se lee como minutos y segundos", () => {
  assert.equal(formatMoment(0), "0:00");
  assert.equal(formatMoment(3200), "0:03");
  assert.equal(formatMoment(64000), "1:04");
});

test("redondea al segundo más cercano y nunca muestra tiempos negativos", () => {
  assert.equal(formatMoment(2600), "0:03");
  assert.equal(formatMoment(-500), "0:00");
});

test("un tramo muestra su principio y su final", () => {
  assert.equal(formatSpan(0, 3000), "0:00 – 0:03");
});
