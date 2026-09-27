import assert from "node:assert/strict";
import test from "node:test";
import { CONTENT_KINDS } from "../lib/content/library.ts";
import {
  CONTENT_FORMATS,
  CONTENT_PIPELINE,
  contentItemName,
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
  scriptAsText,
  splitRecentlyPublished,
  RECENTLY_PUBLISHED_DAYS,
  collectContentTypes,
  contentTypeSuggestions,
  matchesContentType,
  STARTER_CONTENT_TYPES,
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
  assert.equal(isContentFormat("publication"), true);
  // "post" era el nombre viejo, antes de unificar el vocabulario con la biblioteca.
  assert.equal(isContentFormat("post"), false);
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
  // Adentro se llama publication, para coincidir con la biblioteca; afuera, "Post".
  assert.equal(FORMAT_LABELS.publication, "Post");
});

test("una idea se guarda con sólo el link, sin título", () => {
  const result = sanitizeContentItem({ referenceUrl: "https://www.instagram.com/reel/abc/" });

  assert.equal(result.ok, true);
  assert.equal(result.value.title, "");
  assert.equal(result.value.referenceUrl, "https://www.instagram.com/reel/abc/");
});

test("sin título y sin link no hay idea que guardar", () => {
  const result = sanitizeContentItem({ title: "  ", referenceUrl: "" });

  assert.equal(result.ok, false);
  assert.match(result.errors.title, /título o pegá un link/);
});

test("una idea sin título se nombra con su link", () => {
  assert.equal(
    contentItemName({ title: "", referenceUrl: "https://www.instagram.com/reel/abc/" }),
    "instagram.com/reel/abc",
  );
  assert.equal(contentItemName({ title: "Mitos de agenda", referenceUrl: "" }), "Mitos de agenda");
  assert.equal(contentItemName({ title: "", referenceUrl: "" }), "Sin título");
});

test("el formato de producción y el de la biblioteca son el mismo vocabulario", () => {
  // Si alguien agrega un formato en un lado y no en el otro, vincular una idea con su
  // pieza publicada dejaría de funcionar en silencio.
  assert.deepEqual([...CONTENT_FORMATS], [...CONTENT_KINDS]);
});

const AHORA = new Date("2026-09-26T12:00:00Z");
const haceDias = (days) => new Date(AHORA.getTime() - days * 86_400_000).toISOString();

test("splitRecentlyPublished separa lo de las últimas dos semanas", () => {
  const { recent, older } = splitRecentlyPublished(
    [
      { id: "ayer", publishedAt: haceDias(1) },
      { id: "justo", publishedAt: haceDias(RECENTLY_PUBLISHED_DAYS - 0.5) },
      { id: "viejo", publishedAt: haceDias(RECENTLY_PUBLISHED_DAYS + 1) },
    ],
    AHORA,
  );

  assert.deepEqual(recent.map((item) => item.id), ["ayer", "justo"]);
  assert.deepEqual(older.map((item) => item.id), ["viejo"]);
});

test("splitRecentlyPublished manda al historial lo que no tiene fecha", () => {
  // No se sabe cuándo salió: decir que salió recién sería inventarlo.
  const { recent, older } = splitRecentlyPublished([{ id: "sinfecha", publishedAt: null }], AHORA);

  assert.deepEqual(recent, []);
  assert.deepEqual(older.map((item) => item.id), ["sinfecha"]);
});

test("splitRecentlyPublished no rompe con una fecha inválida", () => {
  const { recent, older } = splitRecentlyPublished([{ id: "rota", publishedAt: "ayer" }], AHORA);

  assert.deepEqual(recent, []);
  assert.deepEqual(older.map((item) => item.id), ["rota"]);
});

test("collectContentTypes junta los tipos y los cuenta", () => {
  const types = collectContentTypes([
    { contentType: "atracción" },
    { contentType: "testimonio" },
    { contentType: "atracción" },
    { contentType: "" },
    { contentType: "   " },
  ]);

  assert.deepEqual(types, [
    { value: "atracción", count: 2 },
    { value: "testimonio", count: 1 },
  ]);
});

test("collectContentTypes no separa por tildes ni mayúsculas", () => {
  // Si "Atracción" y "atraccion" contaran como dos, el filtro se llenaría de duplicados
  // que el creador cree que son lo mismo, y lo son.
  const types = collectContentTypes([
    { contentType: "Atracción" },
    { contentType: "atraccion" },
    { contentType: "ATRACCION" },
  ]);

  assert.equal(types.length, 1);
  assert.equal(types[0].count, 3);
  assert.equal(types[0].value, "Atracción", "se muestra la forma que escribió primero");
});

test("collectContentTypes ordena por uso y después alfabéticamente", () => {
  const types = collectContentTypes([
    { contentType: "venta" },
    { contentType: "autoridad" },
    { contentType: "nutrición" },
    { contentType: "nutrición" },
  ]);

  assert.deepEqual(
    types.map((type) => type.value),
    ["nutrición", "autoridad", "venta"],
  );
});

test("matchesContentType compara con la misma laxitud", () => {
  assert.equal(matchesContentType({ contentType: " Atracción " }, "atraccion"), true);
  assert.equal(matchesContentType({ contentType: "venta" }, "autoridad"), false);
  assert.equal(matchesContentType({ contentType: "" }, ""), true);
});

test("sin tipos propios se ofrecen los de arranque", () => {
  assert.deepEqual(contentTypeSuggestions([]), STARTER_CONTENT_TYPES);
});

test("con tipos propios los de arranque desaparecen", () => {
  // Ver los propios perdidos entre siete ajenos es peor que no ver sugerencias.
  assert.deepEqual(contentTypeSuggestions(["mi categoría"]), ["mi categoría"]);
});

test("sanitizeContentItem sólo acepta fechas YYYY-MM-DD que existan", () => {
  const conFecha = (targetDate) => {
    const result = sanitizeContentItem({ title: "Una pieza", targetDate });
    return result.ok ? result.value.targetDate : "ERROR";
  };

  assert.equal(conFecha("2026-09-30"), "2026-09-30");
  // "5/9/2026" pasaba y Postgres la guardaba como 9 de mayo: la pieza aparecía en un día
  // que nadie eligió.
  assert.equal(conFecha("5/9/2026"), null);
  assert.equal(conFecha("Sep 5 2026"), null);
  assert.equal(conFecha("2026-02-30"), null, "el 30 de febrero no existe");
  assert.equal(conFecha("2026-13-01"), null, "no hay mes 13");
  assert.equal(conFecha(""), null);
  assert.equal(conFecha(null), null);
});


test("scriptAsText arma el guion rotulado y en orden", () => {
  const texto = scriptAsText({
    title: "3 mitos sobre la agenda",
    hook: "Nadie te dice esto",
    development: "Primero...",
    cta: "Escribime",
  });

  assert.equal(
    texto,
    "3 mitos sobre la agenda\n\nHOOK\nNadie te dice esto\n\nDESARROLLO\nPrimero...\n\nCTA\nEscribime",
  );
});

test("scriptAsText omite las partes vacías sin dejar huecos", () => {
  const texto = scriptAsText({ title: "", hook: "Solo el hook", development: "  ", cta: "" });

  assert.equal(texto, "HOOK\nSolo el hook");
});
