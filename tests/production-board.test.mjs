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
  cta: "",
  referenceUrl: "",
  ...overrides,
});
const buscar = (items, query) =>
  buildProductionBoard({ items, published: [], requestedType: null, query, now: AHORA }).matches.map(
    (item) => item.id,
  );
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

test("la búsqueda mira todo lo que el creador escribió", () => {
  const items = [
    pieza({ id: "titulo", title: "Errores al vender" }),
    pieza({ id: "hook", hook: "Nadie te cuenta esto del lanzamiento" }),
    pieza({ id: "tipo", contentType: "testimonio" }),
    pieza({ id: "link", referenceUrl: "https://instagram.com/reel/abc" }),
    pieza({ id: "nada", title: "Receta de panqueques" }),
  ];

  assert.deepEqual(build(items, [], null).matches, [], "sin buscar no hay resultados");
  assert.deepEqual(buscar(items, "vender"), ["titulo"]);
  assert.deepEqual(buscar(items, "lanzamiento"), ["hook"]);
  assert.deepEqual(buscar(items, "testimonio"), ["tipo"]);
  assert.deepEqual(buscar(items, "instagram"), ["link"]);
});

test("la búsqueda ignora tildes y mayúsculas", () => {
  const items = [pieza({ id: "a", title: "Guión para vender" })];

  assert.deepEqual(buscar(items, "GUION"), ["a"]);
});

test("varias palabras tienen que estar todas, en cualquier orden", () => {
  // Uno se acuerda de a pedazos: "curso errores" tiene que encontrar la pieza.
  const items = [
    pieza({ id: "si", title: "Los errores que cometí al vender mi primer curso" }),
    pieza({ id: "no", title: "Errores al grabar" }),
  ];

  assert.deepEqual(buscar(items, "curso errores"), ["si"]);
});

test("buscar achica el tablero y además ofrece a dónde saltar", () => {
  const items = [
    pieza({ id: "a", title: "Errores al vender" }),
    pieza({ id: "b", title: "Receta de panqueques" }),
  ];

  const board = buildProductionBoard({
    items,
    published: [],
    requestedType: null,
    query: "errores",
    now: AHORA,
  });

  assert.deepEqual(board.visible.map((item) => item.id), ["a"], "el tablero se achica");
  assert.deepEqual(board.matches.map((item) => item.id), ["a"], "y ofrece el atajo");
});

test("buscar y filtrar por tipo se aplican juntos al tablero", () => {
  const items = [
    pieza({ id: "a", title: "Errores al vender", contentType: "venta" }),
    pieza({ id: "b", title: "Errores al grabar", contentType: "autoridad" }),
  ];

  const board = buildProductionBoard({
    items,
    published: [],
    requestedType: "venta",
    query: "errores",
    now: AHORA,
  });

  assert.deepEqual(board.visible.map((item) => item.id), ["a"]);
});

test("los resultados tienen tope: una lista larga deja de ser un atajo", () => {
  const items = Array.from({ length: 12 }, (_, index) =>
    pieza({ id: `p${index}`, title: `Errores numero ${index}` }),
  );

  assert.equal(buscar(items, "errores").length, 6);
});

test("sin nada escrito no se considera una búsqueda activa", () => {
  assert.equal(build([pieza()], [], null).searching, false);
  assert.equal(
    buildProductionBoard({ items: [pieza()], published: [], requestedType: null, query: "   ", now: AHORA })
      .searching,
    false,
  );
});
