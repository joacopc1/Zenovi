import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCohort,
  searchContentItems,
  sortContentItems,
  viewsRank,
} from "../lib/content/library.ts";

test("el cohorte se limita al formato pedido", () => {
  const items = [item("a", "reel"), item("b", "publication"), item("c", "reel")];

  assert.deepEqual(buildCohort(items, "reel").map(({ id }) => id), ["a", "c"]);
});

test("busca en el caption sin distinguir mayúsculas", () => {
  const items = [
    item("a", "reel", "Cómo vender sin perseguir"),
    item("b", "reel", "Oferta"),
  ];

  assert.deepEqual(searchContentItems(items, "VENDER").map(({ id }) => id), ["a"]);
});

test("ordena métricas concretas de mayor a menor y deja faltantes al final", () => {
  const items = buildCohort([
    item("missing", "reel", null, null),
    item("low", "reel", null, 10),
    item("high", "reel", null, 30),
  ], "reel");

  assert.deepEqual(sortContentItems(items, "views").map(({ id }) => id), ["high", "low", "missing"]);
});

test("invierte el orden sin promover las piezas sin dato", () => {
  const items = buildCohort([
    item("missing", "reel", null, null),
    item("low", "reel", null, 10),
    item("high", "reel", null, 30),
  ], "reel");

  assert.deepEqual(
    sortContentItems(items, "views", "asc").map(({ id }) => id),
    ["low", "high", "missing"],
  );
});

test("mide cada pieza contra la mediana de su cohorte", () => {
  const ranked = buildCohort([
    item("a", "reel", null, 100),
    item("b", "reel", null, 200),
    item("c", "reel", null, 300),
    item("d", "reel", null, 400),
    item("e", "reel", null, 500),
  ], "reel");
  const multiplierById = new Map(ranked.map(({ id, multiplier }) => [id, multiplier]));

  // La mediana de cinco piezas es 300.
  assert.equal(multiplierById.get("c"), 1);
  assert.equal(multiplierById.get("e"), 500 / 300);
});

test("no afirma un multiplicador cuando el histórico es demasiado corto", () => {
  const ranked = buildCohort([
    item("a", "reel", null, 100),
    item("b", "reel", null, 900),
  ], "reel");

  assert.deepEqual(ranked.map(({ multiplier }) => multiplier), [null, null]);
});

test("una pieza sin vistas no recibe multiplicador aunque haya base", () => {
  const ranked = buildCohort([
    item("a", "reel", null, 100),
    item("b", "reel", null, 200),
    item("c", "reel", null, 300),
    item("d", "reel", null, 400),
    item("sin-dato", "reel", null, null),
  ], "reel");

  assert.equal(ranked.find(({ id }) => id === "sin-dato").multiplier, null);
});

test("buscar no cambia el multiplicador que ya midió el cohorte", () => {
  const cohort = buildCohort([
    item("uno", "reel", "hook", 100),
    item("dos", "reel", null, 200),
    item("tres", "reel", null, 300),
    item("cuatro", "reel", null, 400),
    item("cinco", "reel", null, 500),
  ], "reel");
  const [encontrado] = searchContentItems(cohort, "hook");

  assert.equal(encontrado.id, "uno");
  assert.equal(encontrado.multiplier, 100 / 300);
});

test("ubica la pieza dentro de su cohorte por visualizaciones", () => {
  const cohort = buildCohort([
    item("flojo", "reel", null, 100),
    item("medio", "reel", null, 300),
    item("mejor", "reel", null, 500),
  ], "reel");

  assert.deepEqual(viewsRank(cohort, "mejor"), { position: 1, total: 3 });
  assert.deepEqual(viewsRank(cohort, "flojo"), { position: 3, total: 3 });
});

test("no cuenta las piezas sin vistas al calcular el puesto", () => {
  const cohort = buildCohort([
    item("uno", "reel", null, 100),
    item("dos", "reel", null, 300),
    item("tres", "reel", null, 500),
    item("sin-dato", "reel", null, null),
  ], "reel");

  assert.deepEqual(viewsRank(cohort, "uno"), { position: 3, total: 3 });
  assert.equal(viewsRank(cohort, "sin-dato"), null);
});

function item(id, kind, caption = null, views = 0) {
  return {
    id,
    kind,
    formatLabel: kind === "reel" ? "Reel" : "Publicación",
    caption,
    thumbnailUrl: null,
    mediaUrl: null,
    permalink: null,
    postedAt: `2026-09-${id === "a" ? "11" : "10"}T12:00:00Z`,
    dateLabel: "11 sept 2026",
    relativeDateLabel: "Hoy",
    likes: null,
    comments: null,
    views,
    reach: null,
    interactions: null,
    saves: null,
    shares: null,
    averageWatchTimeMs: null,
    totalWatchTimeMs: null,
    skipRate: null,
  };
}
