import assert from "node:assert/strict";
import test from "node:test";
import { buildProductionBoard } from "../lib/production/board.ts";

const AHORA = new Date(2026, 8, 26, 12, 0, 0);
const haceDias = (days) => new Date(AHORA.getTime() - days * 86_400_000).toISOString();

const pieza = (overrides = {}) => ({
  id: "p1",
  title: "",
  contentType: "",
  format: "reel",
  status: "idea",
  targetDate: null,
  publishedAt: null,
  linkedMediaId: null,
  hook: "",
  development: "",
  ...overrides,
});
const publicacion = (id, postedAt, kind = "reel") => ({
  id,
  postedAt,
  caption: null,
  thumbnailUrl: null,
  kind,
});
const build = (items, published = [], requestedType = null) =>
  buildProductionBoard({ items, published, requestedType, now: AHORA });

test("el tablero lleva lo que está en curso y lo publicado hace poco", () => {
  const board = build([
    pieza({ id: "idea" }),
    pieza({ id: "reciente", status: "publicada", publishedAt: haceDias(3) }),
    pieza({ id: "vieja", status: "publicada", publishedAt: haceDias(40) }),
  ]);

  assert.deepEqual(board.columns.map((item) => item.id).sort(), ["idea", "reciente"]);
  assert.deepEqual(board.history.map((item) => item.id), ["vieja"]);
});

test("el filtro por tipo no toca el historial", () => {
  // El historial es el registro de lo que salió, no una vista de trabajo.
  const board = build(
    [
      pieza({ id: "a", contentType: "venta" }),
      pieza({ id: "b", contentType: "autoridad" }),
      pieza({ id: "vieja", contentType: "autoridad", status: "publicada", publishedAt: haceDias(40) }),
    ],
    [],
    "venta",
  );

  assert.deepEqual(board.columns.map((item) => item.id), ["a"]);
  assert.deepEqual(board.history.map((item) => item.id), ["vieja"]);
});

test("un tipo que ya no existe suelta el filtro en vez de vaciar el tablero", () => {
  const board = build([pieza({ id: "a", contentType: "venta" })], [], "un tipo borrado");

  assert.equal(board.activeType, null);
  assert.deepEqual(board.columns.map((item) => item.id), ["a"]);
});

test("el filtro sobrevive a las diferencias de tildes y mayúsculas", () => {
  const board = build([pieza({ id: "a", contentType: "Atracción" })], [], "atraccion");

  assert.equal(board.activeType, "atraccion");
  assert.deepEqual(board.columns.map((item) => item.id), ["a"]);
});

test("las publicaciones reclamadas se cuentan aunque el filtro esconda su pieza", () => {
  // Si se contaran sobre lo filtrado, el calendario las mostraría como sin registrar.
  const board = build(
    [
      pieza({ id: "a", contentType: "venta" }),
      pieza({
        id: "b",
        contentType: "autoridad",
        status: "publicada",
        publishedAt: haceDias(2),
        linkedMediaId: "m1",
      }),
    ],
    [publicacion("m1", haceDias(2)), publicacion("m2", haceDias(1))],
    "venta",
  );

  assert.deepEqual([...board.claimedMedia], ["m1"]);
  assert.deepEqual(board.unregistered.map((piece) => piece.id), ["m2"]);
});

test("sin tipos propios ofrece los de arranque y no muestra filtro", () => {
  const board = build([pieza({ id: "a" })]);

  assert.deepEqual(board.ownTypes, []);
  assert.ok(board.typeSuggestions.length > 0);
});

test("la cadencia mira la cuenta entera, no lo filtrado", () => {
  const publicadas = Array.from({ length: 24 }, (_, index) => publicacion(`m${index}`, haceDias(8 + index * 2)));
  const board = build(
    [
      pieza({ id: "a", contentType: "venta", targetDate: "2026-09-27" }),
      pieza({ id: "b", contentType: "autoridad", targetDate: "2026-09-28" }),
    ],
    publicadas,
    "venta",
  );

  assert.equal(board.cadence.rhythm, 3);
  assert.equal(board.cadence.planned, 2, "cuenta las dos piezas, no sólo la filtrada");
});
