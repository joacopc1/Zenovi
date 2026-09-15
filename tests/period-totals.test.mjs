import assert from "node:assert/strict";
import test from "node:test";
import { summarizePeriod } from "../lib/analytics/period-totals.ts";

function series(values) {
  return values.map((views, index) => ({
    date: `d${index}`,
    label: `d${index}`,
    views,
    reach: null,
    interactions: null,
  }));
}

test("suma sólo los días del período elegido", () => {
  const total = summarizePeriod(series([1, 1, 1, 10, 20, 30]), "views", 3);

  assert.equal(total.current, 60);
  assert.equal(total.reportedDays, 3);
});

test("compara contra el período anterior de igual largo", () => {
  const total = summarizePeriod(series([1, 2, 3, 10, 20, 30]), "views", 3);

  assert.equal(total.previous, 6);
});

test("no compara cuando la base no guarda un período anterior completo", () => {
  assert.equal(summarizePeriod(series([5, 10, 20, 30]), "views", 3).previous, null);
  assert.equal(summarizePeriod(series([1, null, 3, 10, 20, 30]), "views", 3).previous, null);
});

test("un período sin ningún día informado no vale cero", () => {
  const total = summarizePeriod(series([1, 2, 3, null, null, null, null, null]), "views", 3);

  assert.equal(total.current, null);
  assert.equal(total.reportedDays, 0);
});

test("informa cuántos días del período tienen dato", () => {
  const total = summarizePeriod(series([1, 2, 3, 10, null, 30]), "views", 3);

  assert.equal(total.current, 40);
  assert.equal(total.reportedDays, 2);
});

test("el período termina en el último día cerrado, no en hoy", () => {
  const total = summarizePeriod(series([1, 2, 3, 10, 20, 30, null]), "views", 3);

  assert.equal(total.current, 60);
  assert.equal(total.reportedDays, 3);
  assert.equal(total.previous, 6);
});

test("una falta más larga que la demora de Meta sí cuenta como hueco", () => {
  // Tres días finales vacíos: dos se descuentan como demora, el tercero es un hueco real.
  const total = summarizePeriod(series([1, 2, 3, 10, null, null, null]), "views", 3);

  assert.equal(total.current, 13);
  assert.equal(total.reportedDays, 2);
});
