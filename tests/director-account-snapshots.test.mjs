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

test("el día de una pieza es el de la zona del creador, no el de UTC", async () => {
  const { isWithinDays, localDay } = await import("../lib/director/account-snapshots.ts");
  // 22:30 del 19 de setiembre en Uruguay = 01:30 del 20 en UTC.
  assert.equal(localDay("2026-09-20T01:30:00Z"), "2026-09-19");
  assert.equal(isWithinDays("2026-09-20T01:30:00Z", "2026-09-19", "2026-09-19"), true);
  assert.equal(isWithinDays("2026-09-20T01:30:00Z", "2026-09-20"), false);
  assert.equal(isWithinDays("2026-09-20T01:30:00Z"), true);
  // El mismo instante en Madrid ya es el 20.
  assert.equal(localDay("2026-09-20T01:30:00Z", "Europe/Madrid"), "2026-09-20");
});

test("una zona horaria inventada no llega a Intl: se usa la de Uruguay", async () => {
  const { validTimeZone } = await import("../lib/director/account-snapshots.ts");
  assert.equal(validTimeZone("America/Mexico_City"), "America/Mexico_City");
  assert.equal(validTimeZone("Marte/Base"), "America/Montevideo");
  assert.equal(validTimeZone(42), "America/Montevideo");
});

test("una pieza se nombra por su formato y su día", async () => {
  const { pieceLabel } = await import("../lib/director/account-snapshots.ts");
  assert.equal(pieceLabel({ formatLabel: "Reel", postedAt: "2026-09-29T01:30:00Z" }), "Reel del 28 de setiembre");
});

test("una idea de Producción llega al Director con lo que ya tiene, lista para ajustar", async () => {
  const { ideaPrompt } = await import("../lib/director/account-snapshots.ts");
  const prompt = ideaPrompt({ title: "Errores al vender por DM", hook: "Si vendés por DM, frená", development: "", cta: "" });
  assert.equal(prompt, "Quiero desarrollar esta idea de mi Producción: «Errores al vender por DM».\nGancho: Si vendés por DM, frená\n¿Cómo la mejorarías?");
});
