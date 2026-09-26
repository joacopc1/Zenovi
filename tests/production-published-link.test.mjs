import assert from "node:assert/strict";
import test from "node:test";
import { rankPublishCandidates, takenMediaIds } from "../lib/production/published-link.ts";

const media = (id, kind, postedAt) => ({ id, kind, postedAt });

test("propone sólo publicaciones del mismo formato", () => {
  const candidates = rankPublishCandidates(
    [
      media("r1", "reel", "2026-09-20T12:00:00Z"),
      media("s1", "story", "2026-09-20T12:00:00Z"),
      media("p1", "publication", "2026-09-20T12:00:00Z"),
    ],
    { format: "reel", targetDate: null },
    new Set(),
  );

  assert.deepEqual(
    candidates.map((item) => item.id),
    ["r1"],
  );
});

test("ordena por cercanía a la fecha objetivo", () => {
  const candidates = rankPublishCandidates(
    [
      media("lejos", "reel", "2026-09-10T08:00:00Z"),
      media("justo", "reel", "2026-09-23T22:00:00Z"),
      media("cerca", "reel", "2026-09-25T08:00:00Z"),
    ],
    { format: "reel", targetDate: "2026-09-23" },
    new Set(),
  );

  assert.deepEqual(
    candidates.map((item) => item.id),
    ["justo", "cerca", "lejos"],
  );
});

test("sin fecha objetivo manda lo más reciente", () => {
  const candidates = rankPublishCandidates(
    [
      media("vieja", "reel", "2026-08-01T10:00:00Z"),
      media("nueva", "reel", "2026-09-24T10:00:00Z"),
      media("media", "reel", "2026-09-01T10:00:00Z"),
    ],
    { format: "reel", targetDate: null },
    new Set(),
  );

  assert.deepEqual(
    candidates.map((item) => item.id),
    ["nueva", "media", "vieja"],
  );
});

test("a igual distancia desempata la más reciente", () => {
  const candidates = rankPublishCandidates(
    [
      media("antes", "reel", "2026-09-22T10:00:00Z"),
      media("despues", "reel", "2026-09-24T10:00:00Z"),
    ],
    { format: "reel", targetDate: "2026-09-23" },
    new Set(),
  );

  assert.deepEqual(
    candidates.map((item) => item.id),
    ["despues", "antes"],
  );
});

test("no ofrece una publicación que ya es de otra idea", () => {
  const candidates = rankPublishCandidates(
    [media("r1", "reel", "2026-09-24T10:00:00Z"), media("r2", "reel", "2026-09-23T10:00:00Z")],
    { format: "reel", targetDate: null },
    new Set(["r1"]),
  );

  assert.deepEqual(
    candidates.map((item) => item.id),
    ["r2"],
  );
});

test("corta la lista en el límite pedido", () => {
  const published = Array.from({ length: 10 }, (_, index) =>
    media(`r${index}`, "reel", `2026-09-${String(index + 10).padStart(2, "0")}T10:00:00Z`),
  );

  assert.equal(rankPublishCandidates(published, { format: "reel", targetDate: null }, new Set()).length, 6);
  assert.equal(
    rankPublishCandidates(published, { format: "reel", targetDate: null }, new Set(), 2).length,
    2,
  );
});

test("una fecha objetivo inválida no rompe el orden", () => {
  const candidates = rankPublishCandidates(
    [media("nueva", "reel", "2026-09-24T10:00:00Z"), media("vieja", "reel", "2026-09-01T10:00:00Z")],
    { format: "reel", targetDate: "no-es-una-fecha" },
    new Set(),
  );

  assert.deepEqual(
    candidates.map((item) => item.id),
    ["nueva", "vieja"],
  );
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
