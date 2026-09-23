import assert from "node:assert/strict";
import test from "node:test";
import {
  CONTENT_PIPELINE,
  FORMAT_LABELS,
  STATUS_LABELS,
  formatTargetDate,
  parseTargetDate,
  emptyContentItem,
  isContentFormat,
  isContentStatus,
  nextStatus,
  previousStatus,
  resolveDropStatus,
  sanitizeContentItem,
} from "../lib/production/content.ts";

test("sanitizeContentItem exige título", () => {
  const result = sanitizeContentItem({ title: "   " });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.errors.title);
});

test("sanitizeContentItem normaliza campos y enums", () => {
  const result = sanitizeContentItem({
    title: "  Mi idea  ",
    contentType: "corte",
    format: "reel",
    status: "guion",
    targetDate: "2026-09-24",
    referenceUrl: "",
    hook: "  hook ",
    development: "desarrollo",
    cta: "",
    source: "director",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.title, "Mi idea");
  assert.equal(result.value.hook, "hook");
  assert.equal(result.value.format, "reel");
  assert.equal(result.value.status, "guion");
  assert.equal(result.value.source, "director");
  assert.equal(result.value.targetDate, "2026-09-24");
});

test("sanitizeContentItem cae a defaults con enums inválidos", () => {
  const result = sanitizeContentItem({
    title: "X",
    format: "podcast",
    status: "archivada",
    source: "otro",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.format, "reel");
  assert.equal(result.value.status, "idea");
  assert.equal(result.value.source, "manual");
});

test("sanitizeContentItem descarta fechas inválidas", () => {
  const result = sanitizeContentItem({ title: "X", targetDate: "no es fecha" });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.targetDate, null);
});

test("el pipeline avanza idea -> guion -> produccion -> publicada", () => {
  assert.deepEqual(CONTENT_PIPELINE, ["idea", "guion", "produccion", "publicada"]);
  assert.equal(nextStatus("idea"), "guion");
  assert.equal(nextStatus("guion"), "produccion");
  assert.equal(nextStatus("produccion"), "publicada");
  assert.equal(nextStatus("publicada"), "publicada");
});

test("previousStatus retrocede y frena en idea", () => {
  assert.equal(previousStatus("publicada"), "produccion");
  assert.equal(previousStatus("guion"), "idea");
  assert.equal(previousStatus("idea"), "idea");
});

test("guards distinguen enums válidos", () => {
  assert.equal(isContentStatus("guion"), true);
  assert.equal(isContentStatus("borrador"), false);
  assert.equal(isContentFormat("post"), true);
  assert.equal(isContentFormat("video"), false);
});

test("emptyContentItem parte en idea como reel manual", () => {
  const item = emptyContentItem();
  assert.equal(item.status, "idea");
  assert.equal(item.format, "reel");
  assert.equal(item.source, "manual");
  assert.equal(item.title, "");
});

test("al soltar sobre otra tarjeta se usa el estado que la tarjeta lleva encima", () => {
  // dnd-kit devuelve el id de la tarjeta de abajo, no el de la columna.
  assert.equal(resolveDropStatus("8e5a07cf-63ad-4767-ad76-6feaa373cb4b", { status: "guion" }), "guion");
});

test("al soltar sobre el espacio vacío de una columna se usa su id", () => {
  assert.equal(resolveDropStatus("produccion", undefined), "produccion");
  assert.equal(resolveDropStatus("produccion", {}), "produccion");
});

test("un destino desconocido no mueve nada", () => {
  assert.equal(resolveDropStatus("8e5a07cf-63ad", undefined), null);
  assert.equal(resolveDropStatus("8e5a07cf-63ad", { status: "inventado" }), null);
  assert.equal(resolveDropStatus(null, null), null);
});

test("una fecha objetivo se lee al mediodía, no a medianoche", () => {
  // A medianoche, una zona al oeste de Greenwich —la del usuario— la corre un día atrás.
  assert.equal(parseTargetDate("2026-09-23").getDate(), 23);
  // "setiembre" sin la p: es la forma uruguaya, y la configuración es es-UY.
  assert.equal(formatTargetDate("2026-09-23"), "23 de setiembre de 2026");
  assert.equal(formatTargetDate("2026-09-23", "short"), "23 set.");
});

test("cada estado y cada formato tienen su nombre en español", () => {
  assert.deepEqual(
    CONTENT_PIPELINE.map((status) => STATUS_LABELS[status]),
    ["Idea", "Guión", "En producción", "Publicada"],
  );
  assert.equal(FORMAT_LABELS.reel, "Reel");
});
