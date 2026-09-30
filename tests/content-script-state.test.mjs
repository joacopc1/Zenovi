import assert from "node:assert/strict";
import test from "node:test";
import {
  buildScriptSegments,
  parseReelScript,
  parseReelScriptDraft,
  readScriptState,
} from "../lib/content/script.ts";

const draft = {
  segments: [
    { role: "hook", fromMs: 0, toMs: 4000, note: "Contradice una creencia común." },
    { role: "development", fromMs: 4000, toMs: 18000, note: "Explica la métrica." },
    { role: "cta", fromMs: 18000, toMs: 22000, note: "Pide guardar." },
  ],
};

const stored = {
  ...draft,
  pipelineVersion: "script-v1",
  completedAt: "2026-09-28T16:00:00Z",
  transcript: [{ atMs: 0, quote: "No son las views." }],
};

test("acepta un guion estructurado y su transcripción canónica", () => {
  assert.deepEqual(parseReelScriptDraft(draft), draft);
  assert.deepEqual(parseReelScript(stored), stored);
});

test("rechaza roles desconocidos, tiempos que retroceden y transcripciones vacías", () => {
  assert.equal(
    parseReelScriptDraft({
      ...draft,
      segments: [{ role: "intro", fromMs: 0, toMs: 1000, note: "No existe." }],
    }),
    null,
  );
  assert.equal(
    parseReelScriptDraft({
      ...draft,
      segments: [{ role: "hook", fromMs: 2000, toMs: 1000, note: "Retrocede." }],
    }),
    null,
  );
  assert.equal(parseReelScript({ ...stored, transcript: [] }), null);
});

test("lee los estados de persistencia sin convertir ausencia en error", () => {
  assert.deepEqual(readScriptState(null), { status: "not_requested" });
  assert.equal(
    readScriptState({
      status: "ready",
      result: stored,
      failureReason: null,
      canRetry: true,
      startedAt: null,
    }).status,
    "ready",
  );
  assert.equal(
    readScriptState({
      status: "failed",
      result: null,
      failureReason: "No hubo audio.",
      canRetry: true,
      startedAt: null,
    }).reason,
    "No hubo audio.",
  );
});

test("un guion interrumpido se puede volver a pedir", () => {
  const state = readScriptState(
    {
      status: "running",
      result: null,
      failureReason: null,
      canRetry: true,
      startedAt: "2026-09-28T15:00:00Z",
    },
    new Date("2026-09-28T15:11:00Z"),
  );

  assert.equal(state.status, "failed");
  assert.equal(state.canRetry, true);
});

test("construye Hook y CTA exactos desde límites de líneas, sin tiempos inventados", () => {
  const transcript = [
    { atMs: 0, quote: "Hay una métrica que atrae compradores y no son las views." },
    { atMs: 4120, quote: "Muchos negocios crean contenido para llegar a más gente." },
    { atMs: 20380, quote: "La métrica que miramos es Cash Collected." },
    { atMs: 85680, quote: "Comentá sistema y te lo paso." },
  ];

  assert.deepEqual(buildScriptSegments(transcript, {
    hookEndIndex: 1,
    developmentBreakIndexes: [2],
    ctaStartIndex: 3,
  }), [
    { role: "hook", fromMs: 0, toMs: 4120, note: "Hook" },
    { role: "development", fromMs: 4120, toMs: 20380, note: "Desarrollo" },
    { role: "development", fromMs: 20380, toMs: 85680, note: "Desarrollo" },
    { role: "cta", fromMs: 85680, toMs: 85681, note: "CTA" },
  ]);
});

test("no inventa un CTA cuando el Reel termina sin pedir una acción", () => {
  const transcript = [
    { atMs: 0, quote: "Tres errores que frenan tus ventas." },
    { atMs: 3000, quote: "El primero es medir sólo las views." },
    { atMs: 7000, quote: "Eso atrae atención, pero no demuestra ventas." },
  ];

  assert.deepEqual(buildScriptSegments(transcript, {
    hookEndIndex: 1,
    developmentBreakIndexes: [],
    ctaStartIndex: -1,
  }), [
    { role: "hook", fromMs: 0, toMs: 3000, note: "Hook" },
    { role: "development", fromMs: 3000, toMs: 7001, note: "Desarrollo" },
  ]);
});

test("rechaza límites que dejan el desarrollo vacío o ponen el CTA antes del Hook", () => {
  const transcript = [
    { atMs: 0, quote: "Hook." },
    { atMs: 2000, quote: "Desarrollo." },
    { atMs: 5000, quote: "CTA." },
  ];

  assert.throws(() =>
    buildScriptSegments(transcript, { hookEndIndex: 2, developmentBreakIndexes: [], ctaStartIndex: 2 }),
  );
  assert.throws(() =>
    buildScriptSegments(transcript, { hookEndIndex: 2, developmentBreakIndexes: [], ctaStartIndex: 1 }),
  );
});

test("rechaza cortes de desarrollo repetidos, desordenados o fuera del desarrollo", () => {
  const transcript = [
    { atMs: 0, quote: "Hook." },
    { atMs: 2000, quote: "Idea uno." },
    { atMs: 5000, quote: "Idea dos." },
    { atMs: 8000, quote: "CTA." },
  ];

  assert.throws(() => buildScriptSegments(transcript, {
    hookEndIndex: 1,
    developmentBreakIndexes: [2, 2],
    ctaStartIndex: 3,
  }));
  assert.throws(() => buildScriptSegments(transcript, {
    hookEndIndex: 1,
    developmentBreakIndexes: [3],
    ctaStartIndex: 3,
  }));
});
