import assert from "node:assert/strict";
import test from "node:test";
import {
  autoMatch,
  pieceMatchText,
  scorePublishCandidates,
  takenMediaIds,
  textAffinity,
} from "../lib/production/published-link.ts";

const media = (id, kind, postedAt, caption = null) => ({ id, kind, postedAt, caption });
const ids = (candidates) => candidates.map((entry) => entry.media.id);

test("propone sólo publicaciones del mismo formato", () => {
  const candidates = scorePublishCandidates(
    [
      media("r1", "reel", "2026-09-20T12:00:00Z"),
      media("s1", "story", "2026-09-20T12:00:00Z"),
      media("p1", "publication", "2026-09-20T12:00:00Z"),
    ],
    { format: "reel", targetDate: null, text: "" },
    new Set(),
  );

  assert.deepEqual(ids(candidates), ["r1"]);
});

test("el texto manda sobre la fecha", () => {
  // El caso real: subió el Reel el lunes, movió la tarjeta el jueves, y ese jueves
  // publicó otro. La fecha apunta al equivocado; el caption apunta al correcto.
  const candidates = scorePublishCandidates(
    [
      media("otro", "reel", "2026-09-24T10:00:00Z", "Tres cosas que aprendí viajando"),
      media("elbueno", "reel", "2026-09-21T10:00:00Z", "Los errores que cometí vendiendo mi primer curso"),
    ],
    {
      format: "reel",
      targetDate: "2026-09-24",
      text: pieceMatchText({ title: "Errores vendiendo mi primer curso", hook: "" }),
    },
    new Set(),
  );

  assert.deepEqual(ids(candidates), ["elbueno", "otro"]);
});

test("sin texto que cruzar, la fecha ordena", () => {
  const candidates = scorePublishCandidates(
    [
      media("lejos", "reel", "2026-09-10T08:00:00Z"),
      media("justo", "reel", "2026-09-23T22:00:00Z"),
      media("cerca", "reel", "2026-09-25T08:00:00Z"),
    ],
    { format: "reel", targetDate: "2026-09-23", text: "" },
    new Set(),
  );

  assert.deepEqual(ids(candidates), ["justo", "cerca", "lejos"]);
});

test("sin texto ni fecha manda lo más reciente", () => {
  const candidates = scorePublishCandidates(
    [
      media("vieja", "reel", "2026-08-01T10:00:00Z"),
      media("nueva", "reel", "2026-09-24T10:00:00Z"),
      media("media", "reel", "2026-09-01T10:00:00Z"),
    ],
    { format: "reel", targetDate: null, text: "" },
    new Set(),
  );

  assert.deepEqual(ids(candidates), ["nueva", "media", "vieja"]);
});

test("no ofrece una publicación que ya es de otra idea", () => {
  const candidates = scorePublishCandidates(
    [media("r1", "reel", "2026-09-24T10:00:00Z"), media("r2", "reel", "2026-09-23T10:00:00Z")],
    { format: "reel", targetDate: null, text: "" },
    new Set(["r1"]),
  );

  assert.deepEqual(ids(candidates), ["r2"]);
});

test("corta la lista en el límite pedido", () => {
  const published = Array.from({ length: 10 }, (_, index) =>
    media(`r${index}`, "reel", `2026-09-${String(index + 10).padStart(2, "0")}T10:00:00Z`),
  );
  const piece = { format: "reel", targetDate: null, text: "" };

  assert.equal(scorePublishCandidates(published, piece, new Set()).length, 6);
  assert.equal(scorePublishCandidates(published, piece, new Set(), 2).length, 2);
});

test("una fecha objetivo inválida no rompe el orden", () => {
  const candidates = scorePublishCandidates(
    [media("nueva", "reel", "2026-09-24T10:00:00Z"), media("vieja", "reel", "2026-09-01T10:00:00Z")],
    { format: "reel", targetDate: "no-es-una-fecha", text: "" },
    new Set(),
  );

  assert.deepEqual(ids(candidates), ["nueva", "vieja"]);
});

test("textAffinity ignora tildes, mayúsculas y puntuación", () => {
  const { affinity, matchedWords } = textAffinity(
    "¿Guión para VENDER?",
    "guion para vender sin parecer un vendedor",
  );

  assert.equal(matchedWords, 2);
  assert.equal(affinity, 1);
});

test("textAffinity descarta las palabras cortas", () => {
  // "de" y "un" están en cualquier caption: si contaran, cualquier pieza coincidiría.
  const { matchedWords } = textAffinity("de un lanzamiento", "hablemos de un producto");

  assert.equal(matchedWords, 0);
});

test("textAffinity descarta el relleno aunque sea largo", () => {
  // "Cómo vender más" contra "Cómo cocinar más": sin descartar relleno coincidirían en
  // dos de tres palabras y Zenovi ataría la pieza equivocada.
  const { affinity, matchedWords } = textAffinity("Cómo vender más", "Cómo cocinar más rico");

  assert.equal(matchedWords, 0);
  assert.equal(affinity, 0);
});

test("textAffinity sin caption es cero", () => {
  assert.deepEqual(textAffinity("lanzamiento", null), { affinity: 0, matchedWords: 0 });
});

test("pieceMatchText usa título y hook, no el desarrollo", () => {
  assert.equal(pieceMatchText({ title: "Mi caso", hook: "Perdí 3000 dólares" }), "Mi caso Perdí 3000 dólares");
});

test("autoMatch ata sola la coincidencia fuerte y única", () => {
  const candidates = scorePublishCandidates(
    [
      media("elbueno", "reel", "2026-09-21T10:00:00Z", "Los errores que cometí vendiendo mi primer curso"),
      media("otro", "reel", "2026-09-24T10:00:00Z", "Receta de panqueques"),
    ],
    { format: "reel", targetDate: null, text: "errores vendiendo curso" },
    new Set(),
  );

  assert.equal(autoMatch(candidates)?.id, "elbueno");
});

test("autoMatch no ata cuando dos publicaciones se parecen", () => {
  const candidates = scorePublishCandidates(
    [
      media("a", "reel", "2026-09-21T10:00:00Z", "Errores vendiendo tu primer curso"),
      media("b", "reel", "2026-09-24T10:00:00Z", "Errores vendiendo tu segundo curso"),
    ],
    { format: "reel", targetDate: null, text: "errores vendiendo curso" },
    new Set(),
  );

  assert.equal(autoMatch(candidates), null);
});

test("autoMatch no ata con una sola palabra en común", () => {
  const candidates = scorePublishCandidates(
    [media("a", "reel", "2026-09-21T10:00:00Z", "Hablemos de lanzamiento")],
    { format: "reel", targetDate: null, text: "lanzamiento" },
    new Set(),
  );

  assert.equal(autoMatch(candidates), null);
});

test("autoMatch no ata cuando no hay candidatas", () => {
  assert.equal(autoMatch([]), null);
});

test("takenMediaIds junta los vínculos de las demás piezas", () => {
  const items = [
    { id: "a", format: "reel", targetDate: null, linkedMediaId: "m1" },
    { id: "b", format: "reel", targetDate: null, linkedMediaId: null },
    { id: "c", format: "reel", targetDate: null, linkedMediaId: "m2" },
  ];

  assert.deepEqual([...takenMediaIds(items)].sort(), ["m1", "m2"]);
});

test("takenMediaIds ignora el vínculo de la pieza que se está editando", () => {
  const items = [
    { id: "a", format: "reel", targetDate: null, linkedMediaId: "m1" },
    { id: "c", format: "reel", targetDate: null, linkedMediaId: "m2" },
  ];

  assert.deepEqual([...takenMediaIds(items, "a")], ["m2"]);
});
