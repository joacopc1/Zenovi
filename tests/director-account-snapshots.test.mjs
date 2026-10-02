import assert from "node:assert/strict";
import test from "node:test";
import { pieceHref, pieceSnapshot } from "../lib/director/account-snapshots.ts";

const item = (overrides = {}) => ({
  id: "abc",
  kind: "reel",
  formatLabel: "Reel",
  postedAt: "2026-09-28T15:00:00Z",
  caption: "  Tres errores que frenan tu marca personal  ",
  views: 4200,
  reach: 3100,
  interactions: null,
  likes: 180,
  comments: null,
  saves: 42,
  shares: 17,
  follows: null,
  profileVisits: null,
  replies: null,
  multiplier: 1.8361,
  ...overrides,
});

test("el Director no recibe como cero un dato que Instagram no devolvió", () => {
  const snapshot = pieceSnapshot(item());
  assert.deepEqual(snapshot.metricas, { views: 4200, alcance: 3100, me_gusta: 180, guardados: 42, compartidos: 17 });
  assert.equal(snapshot.publicado, "2026-09-28");
  assert.equal(snapshot.caption, "Tres errores que frenan tu marca personal");
});

test("cuánto rindió contra lo habitual llega redondeado, y null si no hay con qué comparar", () => {
  assert.equal(pieceSnapshot(item()).vs_habitual, 1.84);
  assert.equal(pieceSnapshot(item({ multiplier: null })).vs_habitual, null);
});

test("el enlace de la cita abre la pieza en su formato", () => {
  assert.equal(pieceHref({ id: "abc", kind: "reel" }), "/content/abc");
  assert.equal(pieceHref({ id: "abc", kind: "story" }), "/content/abc?type=story");
});

test("un caption largo se recorta para no gastar tokens", () => {
  const snapshot = pieceSnapshot(item({ caption: "x".repeat(400) }));
  assert.equal(snapshot.caption.length, 160);
  assert.ok(snapshot.caption.endsWith("…"));
});
