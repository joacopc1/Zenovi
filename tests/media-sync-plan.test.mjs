import assert from "node:assert/strict";
import test from "node:test";
import { needsMoreMedia, planMediaInsightRefresh, readNextCursor } from "../lib/meta/media-sync-plan.ts";

test("hay otra página sólo si Meta manda next", () => {
  assert.equal(
    readNextCursor({ data: [], paging: { cursors: { after: "QVFIUmlw_n-3=" }, next: "https://graph.instagram.com/..." } }),
    "QVFIUmlw_n-3=",
  );
});

test("la última página trae cursor pero no next: no se sigue", () => {
  // Comportamiento verificado contra la API con @elcostarrica.
  assert.equal(readNextCursor({ data: [], paging: { cursors: { after: "QVFIUmlw" } } }), null);
});

test("descarta cursores con formato inesperado", () => {
  assert.equal(readNextCursor({ paging: { next: "x", cursors: { after: "../../otro?x=1" } } }), null);
  assert.equal(readNextCursor({ paging: { next: "x", cursors: { after: "a".repeat(600) } } }), null);
  assert.equal(readNextCursor(null), null);
});

const now = new Date("2026-09-15T12:00:00Z");

function piece(id, postedAt, hasInsights = true) {
  return { id, postedAt, hasInsights };
}

test("actualiza siempre las piezas recientes, de la más nueva a la más vieja", () => {
  const plan = planMediaInsightRefresh({
    media: [piece("julio", "2026-07-01T00:00:00Z"), piece("sept", "2026-09-10T00:00:00Z"), piece("agosto", "2026-08-01T00:00:00Z")],
    now,
  });

  assert.deepEqual(plan, ["sept", "agosto", "julio"]);
});

test("las viejas con datos no se vuelven a pedir; las viejas sin datos sí", () => {
  const plan = planMediaInsightRefresh({
    media: [
      piece("reciente", "2026-09-01T00:00:00Z"),
      piece("vieja-con-datos", "2025-01-01T00:00:00Z", true),
      piece("vieja-sin-datos", "2025-02-01T00:00:00Z", false),
    ],
    now,
  });

  assert.deepEqual(plan, ["reciente", "vieja-sin-datos"]);
});

test("respeta el tope por corrida y prioriza las recientes", () => {
  const plan = planMediaInsightRefresh({
    media: [
      piece("vieja-sin-datos", "2025-02-01T00:00:00Z", false),
      piece("reciente-1", "2026-09-01T00:00:00Z"),
      piece("reciente-2", "2026-09-02T00:00:00Z"),
    ],
    now,
    budget: 2,
  });

  assert.deepEqual(plan, ["reciente-2", "reciente-1"]);
});

test("trae siempre al menos las últimas 100 piezas", () => {
  assert.equal(needsMoreMedia({ fetchedCount: 100 - 1, oldestPostedAt: "2020-01-01T00:00:00Z", now }), true);
});

test("pasadas las 100, sigue sólo si todavía son de los últimos 90 días", () => {
  assert.equal(needsMoreMedia({ fetchedCount: 100, oldestPostedAt: "2026-08-01T00:00:00Z", now }), true);
  assert.equal(needsMoreMedia({ fetchedCount: 100, oldestPostedAt: "2026-05-01T00:00:00Z", now }), false);
});

test("nunca pasa del tope de seguridad", () => {
  assert.equal(needsMoreMedia({ fetchedCount: 300, oldestPostedAt: "2026-09-14T00:00:00Z", now }), false);
});
