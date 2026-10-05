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
  durationMs: null,
  averageWatchTimeMs: null,
  skipRate: null,
  storyForwardTaps: null,
  storyBackTaps: null,
  storyExits: null,
  storyNextSwipes: null,
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

test("en un Reel llegan la retención y cuánto lo saltearon, en segundos y porcentaje", () => {
  const snapshot = pieceSnapshot(item({ durationMs: 31_240, averageWatchTimeMs: 8_460, skipRate: 0.412 }));
  assert.equal(snapshot.metricas.duracion_segundos, 31.2);
  assert.equal(snapshot.metricas.segundos_vistos_en_promedio, 8.5);
  assert.equal(snapshot.metricas.porcentaje_que_lo_salteo, 41.2);
  // Instagram a veces lo manda ya en porcentaje.
  assert.equal(pieceSnapshot(item({ skipRate: 41.2 })).metricas.porcentaje_que_lo_salteo, 41.2);
});

test("el guion llega partido en gancho, desarrollo y cierre con lo que se dijo en cada tramo", async () => {
  const { scriptSnapshot } = await import("../lib/director/account-snapshots.ts");
  const snapshot = scriptSnapshot({
    segments: [
      { role: "hook", fromMs: 0, toMs: 2000, note: "" },
      { role: "development", fromMs: 2000, toMs: 6000, note: "" },
      { role: "development", fromMs: 6000, toMs: 9000, note: "" },
    ],
    transcript: [
      { atMs: 0, quote: "Dejá de vender por DM." },
      { atMs: 2500, quote: "Primero," },
      { atMs: 4000, quote: "ordená la oferta." },
      { atMs: 7000, quote: "Después, el precio." },
    ],
  });
  assert.deepEqual(snapshot, {
    gancho: "Dejá de vender por DM.",
    desarrollo: "Primero, ordená la oferta. Después, el precio.",
    cierre: null,
  });
});

test("un guion larguísimo recorta el desarrollo antes que el gancho y el cierre", async () => {
  const { scriptSnapshot } = await import("../lib/director/account-snapshots.ts");
  const snapshot = scriptSnapshot({
    segments: [
      { role: "hook", fromMs: 0, toMs: 1000, note: "" },
      { role: "development", fromMs: 1000, toMs: 2000, note: "" },
      { role: "cta", fromMs: 2000, toMs: 3000, note: "" },
    ],
    transcript: [
      { atMs: 0, quote: "Gancho corto." },
      { atMs: 1000, quote: "x".repeat(5000) },
      { atMs: 2000, quote: "Seguime." },
    ],
  });
  assert.equal(snapshot.gancho, "Gancho corto.");
  assert.equal(snapshot.cierre, "Seguime.");
  assert.ok(snapshot.desarrollo.endsWith("…"));
  assert.ok(snapshot.gancho.length + snapshot.desarrollo.length + snapshot.cierre.length <= 2400);
});

test("una secuencia de Historias llega con su curva y cada número contra lo habitual", async () => {
  const { sequenceSnapshot } = await import("../lib/director/account-snapshots.ts");
  const { buildStorySequences } = await import("../lib/content/story-sequences.ts");
  const story = (id, day, hour, reach, extra = {}) =>
    item({ id, kind: "story", formatLabel: "Historia", postedAt: `2026-09-${day}T${hour}:00:00Z`, reach, replies: 2, profileVisits: 4, follows: 1, caption: null, ...extra });
  const sequences = buildStorySequences([
    story("a1", "20", "15", 100), story("a2", "20", "16", 80),
    story("b1", "21", "15", 100), story("b2", "21", "16", 70),
    story("c1", "22", "15", 200), story("c2", "22", "16", 150), story("c3", "22", "17", 100, { caption: "  Link en bio  " }),
  ]);
  const snapshot = sequenceSnapshot(sequences[0], sequences);
  assert.equal(snapshot.id, "c1");
  assert.equal(snapshot.enlace, "/content/c1?type=story");
  assert.equal(snapshot.dia, "2026-09-22");
  assert.equal(snapshot.historias, 3);
  assert.equal(snapshot.completaron_pct, 50);
  assert.equal(snapshot.completaron_habitual_pct, 70);
  assert.deepEqual(snapshot.retencion_por_historia_pct, [100, 75, 50]);
  assert.equal(snapshot.respuestas_cada_100, 3);
  assert.deepEqual(snapshot.textos, [null, null, "Link en bio"]);
  assert.equal(snapshot.analisis, null);
});

test("Producción para el Director: sin lo publicado salvo que lo pida, buscable y recortada", async () => {
  const { productionSnapshot } = await import("../lib/director/account-snapshots.ts");
  const base = { format: "reel", contentType: "", targetDate: null, hook: "", development: "", cta: "" };
  const items = [
    { ...base, id: "a", title: "Las 3 ladronas", status: "idea", hook: "Hay tres ladronas" },
    { ...base, id: "b", title: "Precios", status: "guion", development: "x".repeat(2000) },
    { ...base, id: "c", title: "Ya salió", status: "publicada" },
  ];
  const all = productionSnapshot(items, {});
  assert.equal(all.total, 2);
  assert.equal(all.piezas[0].enlace, "/production?item=a");
  assert.equal(all.piezas[1].desarrollo.length, 1200);
  assert.equal(productionSnapshot(items, { texto: "LADRONAS" }).total, 1);
  assert.equal(productionSnapshot(items, { estado: "publicada" }).piezas[0].titulo, "Ya salió");
  assert.equal(productionSnapshot(items, { estado: "todos" }).total, 3);
});
