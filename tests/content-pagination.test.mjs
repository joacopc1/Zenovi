import assert from "node:assert/strict";
import test from "node:test";
import { buildContentUrl, paginate } from "../lib/content/pagination.ts";

const hundred = Array.from({ length: 100 }, (_, index) => index + 1);

test("muestra el rango de la página pedida", () => {
  const result = paginate(hundred, 2, 24);

  assert.equal(result.from, 25);
  assert.equal(result.to, 48);
  assert.equal(result.totalPages, 5);
  assert.deepEqual(result.pageItems.slice(0, 2), [25, 26]);
});

test("la última página trae sólo lo que queda", () => {
  const result = paginate(hundred, 5, 24);

  assert.equal(result.from, 97);
  assert.equal(result.to, 100);
  assert.equal(result.pageItems.length, 4);
});

test("una página fuera de rango cae en la válida más cercana", () => {
  assert.equal(paginate(hundred, 99, 24).page, 5);
  assert.equal(paginate(hundred, 0, 24).page, 1);
  assert.equal(paginate(hundred, Number.NaN, 24).page, 1);
});

test("sin resultados no inventa un rango", () => {
  assert.deepEqual(
    { ...paginate([], 1, 24), pageItems: undefined },
    { pageItems: undefined, page: 1, totalPages: 1, total: 0, from: 0, to: 0 },
  );
});

test("la URL conserva los filtros y omite lo que está por defecto", () => {
  assert.equal(buildContentUrl({ kind: "reel", sort: "recent", direction: "desc", search: "", page: 1 }), "/content");
  assert.equal(
    buildContentUrl({ kind: "publication", sort: "views", direction: "asc", search: " hook ", page: 3 }),
    "/content?type=publication&sort=views&dir=asc&q=hook&page=3",
  );
});
