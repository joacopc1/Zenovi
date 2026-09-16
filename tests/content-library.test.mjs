import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCohort,
  formatBenchmarks,
  rankAllFormats,
  searchContentItems,
  sortContentItems,
  topContentInPeriod,
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

test("mide cada pieza contra su propio formato", () => {
  const ranked = rankAllFormats([
    item("reel-a", "reel", null, 100), item("reel-b", "reel", null, 200), item("reel-c", "reel", null, 300),
    item("post-a", "publication", null, 10), item("post-b", "publication", null, 20), item("post-c", "publication", null, 30),
  ]);
  const byId = new Map(ranked.map((entry) => [entry.id, entry.multiplier]));

  // La mediana de Reels es 200 y la de publicaciones 20: un post de 30 rinde 1,5×, no 0,15×.
  assert.equal(byId.get("reel-c"), 1.5);
  assert.equal(byId.get("post-c"), 1.5);
});

test("lo que funcionó sale sólo de lo publicado en el período, por visualizaciones", () => {
  const ranked = rankAllFormats([
    { ...item("viejo", "reel", null, 999), postedAt: "2026-07-01T10:00:00Z" },
    { ...item("medio", "reel", null, 50), postedAt: "2026-09-05T10:00:00Z" },
    { ...item("mejor", "reel", null, 90), postedAt: "2026-09-10T10:00:00Z" },
    { ...item("sin-dato", "reel", null, null), postedAt: "2026-09-11T10:00:00Z" },
  ]);

  assert.deepEqual(
    topContentInPeriod(ranked, "2026-09-01", "2026-09-14").map(({ id }) => id),
    ["mejor", "medio"],
  );
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

test("compara formatos por su mediana y no por su promedio", () => {
  const benchmarks = formatBenchmarks([
    item("reel-a", "reel", null, 100),
    item("reel-b", "reel", null, 200),
    item("reel-c", "reel", null, 9000),
    item("post-a", "publication", null, 30),
    item("post-b", "publication", null, 40),
    item("post-c", "publication", null, 50),
  ]);
  const byKind = new Map(benchmarks.map((entry) => [entry.kind, entry]));

  // El promedio de Reels sería 3100; la mediana dice lo que pasa habitualmente.
  assert.equal(byKind.get("reel").median, 200);
  assert.equal(byKind.get("reel").best.id, "reel-c");
  assert.equal(byKind.get("publication").median, 40);
});

test("un formato sin base suficiente se cuenta pero no afirma una mediana", () => {
  const [benchmark] = formatBenchmarks([item("uno", "reel", null, 100), item("dos", "reel", null, 200)]);

  assert.equal(benchmark.count, 2);
  assert.equal(benchmark.median, null);
});

test("no inventa filas de formatos que no se publicaron", () => {
  const benchmarks = formatBenchmarks([item("uno", "reel", null, 100)]);

  assert.deepEqual(benchmarks.map(({ kind }) => kind), ["reel"]);
});
