import assert from "node:assert/strict";
import test from "node:test";
import {
  suggestBoardPieces,
  titleForPublication,
  unregisteredPublications,
} from "../lib/production/reconcile.ts";

const publicacion = (id, postedAt, caption = null, kind = "reel") => ({
  id,
  postedAt,
  caption,
  thumbnailUrl: null,
  kind,
});
const pieza = (overrides = {}) => ({
  id: "p1",
  title: "",
  hook: "",
  format: "reel",
  status: "idea",
  linkedMediaId: null,
  ...overrides,
});

test("señala lo publicado que ninguna pieza reclama", () => {
  const found = unregisteredPublications(
    [
      publicacion("m1", "2026-09-20T10:00:00Z"),
      publicacion("m2", "2026-09-22T10:00:00Z"),
      publicacion("m3", "2026-09-24T10:00:00Z"),
    ],
    [
      pieza({ id: "a", status: "publicada", linkedMediaId: "m2" }),
      pieza({ id: "b", linkedMediaId: null }),
    ],
  );

  assert.deepEqual(
    found.map((piece) => piece.id),
    ["m3", "m1"],
  );
});

test("lo más reciente va primero", () => {
  const found = unregisteredPublications(
    [
      publicacion("vieja", "2026-07-01T10:00:00Z"),
      publicacion("nueva", "2026-09-25T10:00:00Z"),
      publicacion("media", "2026-08-15T10:00:00Z"),
    ],
    [],
  );

  assert.deepEqual(
    found.map((piece) => piece.id),
    ["nueva", "media", "vieja"],
  );
});

test("la lista de avisos tiene tope", () => {
  const muchas = Array.from({ length: 20 }, (_, index) =>
    publicacion(`m${index}`, `2026-09-${String(index + 1).padStart(2, "0")}T10:00:00Z`),
  );

  assert.equal(unregisteredPublications(muchas, []).length, 8);
  assert.equal(unregisteredPublications(muchas, [], 3).length, 3);
});

test("cuando el tablero está al día no avisa nada", () => {
  const found = unregisteredPublications(
    [publicacion("m1", "2026-09-20T10:00:00Z")],
    [pieza({ status: "publicada", linkedMediaId: "m1" })],
  );

  assert.deepEqual(found, []);
});

test("sugiere la idea que quedó trabada, por su texto", () => {
  const suggested = suggestBoardPieces(
    [
      pieza({ id: "otra", title: "Receta de panqueques" }),
      pieza({ id: "esta", title: "Errores al vender tu primer curso" }),
    ],
    publicacion("m1", "2026-09-20T10:00:00Z", "Los errores que cometí al vender mi primer curso"),
  );

  assert.equal(suggested[0].id, "esta");
});

test("no sugiere una pieza ya publicada ni una atada a otra cosa", () => {
  const suggested = suggestBoardPieces(
    [
      pieza({ id: "publicada", title: "Errores al vender", status: "publicada" }),
      pieza({ id: "atada", title: "Errores al vender", linkedMediaId: "otra" }),
      pieza({ id: "libre", title: "Errores al vender" }),
    ],
    publicacion("m1", "2026-09-20T10:00:00Z", "Errores al vender"),
  );

  assert.deepEqual(
    suggested.map((item) => item.id),
    ["libre"],
  );
});

test("no sugiere piezas de otro formato", () => {
  const suggested = suggestBoardPieces(
    [pieza({ id: "post", format: "publication", title: "Errores al vender" })],
    publicacion("m1", "2026-09-20T10:00:00Z", "Errores al vender", "reel"),
  );

  assert.deepEqual(suggested, []);
});

test("el título toma las primeras palabras del caption y avisa que hay más", () => {
  assert.equal(
    titleForPublication(
      publicacion("m1", "2026-08-31T10:00:00Z", "Los errores que cometí al vender mi primer curso online"),
      6,
    ),
    "Los errores que cometí al vender…",
  );
  assert.equal(
    titleForPublication(publicacion("m1", "2026-08-31T10:00:00Z", "Dos palabras"), 6),
    "Dos palabras",
  );
});

test("sin caption la nombra por su formato y su fecha", () => {
  // "Sin título" repetido cuatro veces no se reconoce en el tablero; una fecha sí.
  assert.equal(
    titleForPublication(publicacion("m1", "2026-08-31T10:00:00Z", null, "reel")),
    "Reel del 31 de agosto",
  );
  assert.equal(
    titleForPublication(publicacion("m2", "2026-09-11T10:00:00Z", "   ", "publication")),
    "Publicación del 11 de setiembre",
  );
});

test("con una fecha rota se queda con el formato", () => {
  assert.equal(titleForPublication({ ...publicacion("m1", "no-es-fecha"), kind: "reel" }), "Reel");
});
