import assert from "node:assert/strict";
import test from "node:test";
import {
  ANALYSIS_PIPELINE_VERSION,
  GEMINI_REEL_ANALYSIS_SCHEMA,
  isAnalysisOutdated,
  estimateSpeakingPaceWpm,
  isAnalysisJobStatus,
  parseReelAnalysis,
  parseReelAnalysisDraft,
  parseGeneratedReelAnalysisDraft,
  readAnalysisState,
  isAnalysisStale,
} from "../lib/content/analysis.ts";

const fila = (overrides = {}) => ({
  status: "queued",
  result: null,
  failureReason: null,
  canRetry: true,
  startedAt: null,
  ...overrides,
});

test("sin fila, la pieza todavía no se pidió", () => {
  assert.deepEqual(readAnalysisState(null), { status: "not_requested" });
});

test("en cola y corriendo conservan cuándo empezó", () => {
  const now = new Date("2026-09-27T10:03:00Z");
  const enCola = readAnalysisState(fila({ startedAt: "2026-09-27T10:00:00Z" }), now);

  assert.equal(enCola.status, "queued");
  assert.equal(enCola.startedAt, "2026-09-27T10:00:00Z");
  assert.equal(readAnalysisState(fila({ status: "running" }), now).status, "running");
});

test("un trabajo interrumpido se puede volver a intentar", () => {
  const now = new Date("2026-09-27T10:11:00Z");
  const state = readAnalysisState(
    fila({ status: "running", startedAt: "2026-09-27T10:00:00Z" }),
    now,
  );

  assert.equal(state.status, "failed");
  assert.equal(state.canRetry, true);
  assert.equal(isAnalysisStale("2026-09-27T10:00:00Z", now), true);
  assert.equal(isAnalysisStale("2026-09-27T10:08:00Z", now), false);
});

test("un análisis listo devuelve su resultado", () => {
  const state = readAnalysisState(
    fila({
      status: "ready",
      result: {
        ...draft,
        pipelineVersion: "reel-v1",
        completedAt: "2026-09-27T20:00:00Z",
        transcript: [{ atMs: 0, quote: "Hay una métrica" }],
      },
    }),
  );

  assert.equal(state.status, "ready");
  assert.equal(state.analysis.summary, draft.summary);
});

test("listo sin resultado se trata como falla, no rompe la pantalla", () => {
  // La base lo impide con un check, pero la lectura no puede dar por hecho que nadie
  // escribió la fila por otro camino.
  const state = readAnalysisState(fila({ status: "ready", result: null }));

  assert.equal(state.status, "failed");
  assert.equal(state.canRetry, true);
});

test("un fallo lleva su motivo y si se puede reintentar", () => {
  const state = readAnalysisState(
    fila({ status: "failed", failureReason: "El video ya no está disponible.", canRetry: false }),
  );

  assert.equal(state.status, "failed");
  assert.equal(state.reason, "El video ya no está disponible.");
  assert.equal(state.canRetry, false);
});

test("un fallo sin motivo igual dice algo", () => {
  const state = readAnalysisState(fila({ status: "failed" }));

  assert.equal(state.status, "failed");
  assert.ok(state.reason.length > 0);
});

test("un estado que la app no conoce no rompe la pantalla", () => {
  const state = readAnalysisState(fila({ status: "pensando" }));

  assert.equal(state.status, "failed");
  assert.equal(state.canRetry, true);
});

test("isAnalysisJobStatus rechaza lo que no conoce", () => {
  assert.equal(isAnalysisJobStatus("running"), true);
  assert.equal(isAnalysisJobStatus("pensando"), false);
  assert.equal(isAnalysisJobStatus(null), false);
});

const draft = {
  summary: "Explica cómo medir el contenido que trae compradores.",
  audience: { claim: "Habla a dueños que quieren ventas.", evidence: [{ atMs: 4000, quote: "muchos negocios" }] },
  hook: { claim: "Abre contradiciendo una métrica común.", evidence: [{ atMs: 0, quote: "No son las views" }] },
  visualHook: { claim: "Abre a cámara con texto de contraste.", evidence: [{ atMs: 0, quote: "Texto en pantalla: no son las views" }] },
  promise: { claim: "Promete una métrica de negocio.", evidence: [{ atMs: 3000, quote: "Cash collected" }] },
  structure: [{ label: "Hook", fromMs: 0, toMs: 4000, note: "Plantea el problema." }],
  delivery: { claim: "Habla a cámara.", evidence: [{ atMs: 0, quote: "Mira a cámara" }] },
  callToAction: { claim: "Pide comentar.", evidence: [{ atMs: 86000, quote: "Comentá sistema" }] },
  retentionHypotheses: [{ claim: "La explicación central puede sentirse extensa.", evidence: [{ atMs: 20000, quote: "Enumera el proceso sin cambio visual" }] }],
  recommendations: [{ kind: "keep", text: "Conservar el contraste inicial." }],
};

const actionableDraft = {
  performance: {
    verdict: "La pieza atrae interés, pero tarda en convertirlo en una prueba clara.",
    explanation: "La omisión inicial es alta y la prueba aparece después de la explicación.",
    confidence: "medium",
    evidence: [{ atMs: 0, quote: "Apertura sin demostración visual" }],
  },
  findings: [
    {
      kind: "strength",
      title: "El contraste despierta curiosidad",
      insight: "La apertura cuestiona una métrica conocida.",
      impact: "Da una razón para seguir mirando.",
      evidence: [{ atMs: 0, quote: "No son las views" }],
    },
    {
      kind: "friction",
      title: "La prueba llega tarde",
      insight: "El ejemplo numérico aparece después de una explicación extensa.",
      impact: "La promesa tarda en volverse tangible.",
      evidence: [{ atMs: 20_000, quote: "Primera comparación visible" }],
    },
  ],
  attentionHypotheses: [
    {
      title: "Explicación sin cambio visual",
      hypothesis: "La densidad verbal podría reducir la atención antes del ejemplo.",
      confidence: "medium",
      evidence: [{ atMs: 9_000, quote: "Plano estable durante la explicación" }],
    },
  ],
  actionPlan: {
    keep: [{
      title: "Conservá el contraste inicial",
      fromMs: 0,
      toMs: 4_000,
      why: "Abre una brecha de curiosidad.",
      how: "Mantené la oposición entre views y ventas.",
      metricToWatch: "Omisión antes de 3 segundos: debería bajar.",
      evidence: [{ atMs: 0, quote: "No son las views" }],
    }],
    change: [{
      title: "Adelantá la prueba numérica",
      fromMs: 4_000,
      toMs: 8_000,
      why: "La prueba actual aparece tarde.",
      how: "Mostrá primero $0 frente a $8.000 y después explicá el sistema.",
      metricToWatch: "Tiempo medio visto: debería aumentar.",
      evidence: [{ atMs: 20_000, quote: "Comparación $0 y $8.000" }],
    }],
    test: [{
      title: "Probá un corte antes de cada paso",
      fromMs: 8_000,
      toMs: 30_000,
      why: "El tramo concentra mucha explicación verbal.",
      how: "Alterná rostro, captura y palabra clave cada vez que cambia el paso.",
      metricToWatch: "Retención media: compará los próximos tres Reels.",
      evidence: [{ atMs: 9_000, quote: "Plano estable" }],
    }],
  },
  executionReview: [
    {
      dimension: "voice",
      kind: "opportunity",
      title: "La explicación pierde contraste",
      observation: "El ritmo y el volumen se mantienen parejos durante el tramo más denso.",
      impact: "Las ideas importantes pueden sentirse iguales al resto.",
      recommendation: "Bajá el ritmo antes del dato clave y dejá una pausa breve después.",
      evidence: [{ atMs: 12_000, quote: "Ritmo sostenido sin pausa" }],
    },
  ],
  reversionIdeas: [
    {
      title: "Abrí con la comparación",
      change: "Mostrá $0 frente a $8.000 antes de explicar el sistema.",
      why: "La prueba concreta aparece tarde en la versión actual.",
      evidence: [{ atMs: 20_000, quote: "Comparación $0 y $8.000" }],
    },
  ],
  reelMap: [
    {
      role: "hook",
      label: "Contraste inicial",
      fromMs: 0,
      toMs: 4_000,
      visual: "Presentador a cámara con texto destacado.",
      onScreenText: "Y no son las views",
      finding: "El contraste instala la pregunta rápido.",
      recommendation: "Conservar la oposición visual y verbal.",
    },
    {
      role: "development",
      label: "Explicación del sistema",
      fromMs: 4_000,
      toMs: 20_000,
      visual: "Plano estable mientras desarrolla la idea.",
      onScreenText: "",
      finding: "La densidad verbal crece antes de mostrar una prueba.",
      recommendation: "Intercalar una demostración antes del siguiente concepto.",
    },
    {
      role: "proof",
      label: "Prueba numérica",
      fromMs: 20_000,
      toMs: 42_000,
      visual: "Comparación de resultados comerciales en pantalla.",
      onScreenText: "250 chats / $0 · 40 chats / $8.000",
      finding: "La comparación vuelve tangible la tesis.",
      recommendation: "Adelantar esta prueba en futuros videos.",
    },
  ],
};

test("acepta el documento estructurado que devuelve Gemini", () => {
  assert.deepEqual(parseReelAnalysisDraft(draft), draft);
});

test("acepta el contrato compacto de Gemini y exige los tres grupos", () => {
  const actions = Object.entries(actionableDraft.actionPlan).flatMap(([kind, items]) =>
    items.map((item) => ({ kind, ...item })),
  );
  assert.deepEqual(
    parseGeneratedReelAnalysisDraft({ ...actionableDraft, actionPlan: undefined, actions }),
    actionableDraft,
  );
  assert.equal(
    parseGeneratedReelAnalysisDraft({
      ...actionableDraft,
      actionPlan: { ...actionableDraft.actionPlan, test: [] },
    }),
    null,
  );
  assert.equal(parseGeneratedReelAnalysisDraft(actionableDraft), null);
});

test("el contrato de Gemini usa una sola lista de acciones para no exceder su complejidad", () => {
  assert.ok("actions" in GEMINI_REEL_ANALYSIS_SCHEMA.properties);
  assert.equal("actionPlan" in GEMINI_REEL_ANALYSIS_SCHEMA.properties, false);
  assert.ok(GEMINI_REEL_ANALYSIS_SCHEMA.required.includes("actions"));
  assert.ok(GEMINI_REEL_ANALYSIS_SCHEMA.required.includes("reelMap"));
});

test("el mapa exige tramos ordenados y funciones conocidas", () => {
  assert.equal(
    parseReelAnalysisDraft({
      ...actionableDraft,
      reelMap: [
        actionableDraft.reelMap[0],
        { ...actionableDraft.reelMap[1], fromMs: 3_000 },
        actionableDraft.reelMap[2],
      ],
    }),
    null,
  );
  assert.equal(
    parseReelAnalysisDraft({
      ...actionableDraft,
      reelMap: [
        { ...actionableDraft.reelMap[0], role: "relleno" },
        actionableDraft.reelMap[1],
        actionableDraft.reelMap[2],
      ],
    }),
    null,
  );
});

test("normaliza el análisis v2 sin romper resultados ya guardados", () => {
  const actions = Object.entries(actionableDraft.actionPlan).flatMap(([kind, items]) =>
    items.map((item) => ({ kind, ...item })),
  );
  assert.deepEqual(
    parseReelAnalysisDraft({
      ...actionableDraft,
      actionPlan: undefined,
      actions,
      executionReview: undefined,
      reversionIdeas: undefined,
      reelMap: undefined,
    }),
    { ...actionableDraft, executionReview: [], reversionIdeas: [], reelMap: [] },
  );
});

test("estima el ritmo hablado sin inventarlo en clips demasiado cortos", () => {
  assert.equal(
    estimateSpeakingPaceWpm([
      { atMs: 0, quote: "uno dos tres cuatro cinco" },
      { atMs: 10_000, quote: "seis siete ocho nueve diez" },
    ]),
    60,
  );
  assert.equal(estimateSpeakingPaceWpm([{ atMs: 0, quote: "demasiado corto" }]), null);
});

test("sigue leyendo análisis anteriores aunque no tengan los campos nuevos", () => {
  const legacyDraft = {
    summary: draft.summary,
    hook: draft.hook,
    promise: draft.promise,
    structure: draft.structure,
    delivery: draft.delivery,
    callToAction: draft.callToAction,
    recommendations: draft.recommendations,
  };
  assert.deepEqual(parseReelAnalysisDraft(legacyDraft), legacyDraft);
});

test("rechaza evidencia sin momento y tramos que retroceden", () => {
  assert.equal(
    parseReelAnalysisDraft({
      ...draft,
      hook: { claim: "Sin tiempo", evidence: [{ quote: "No alcanza" }] },
    }),
    null,
  );
  assert.equal(
    parseReelAnalysisDraft({
      ...draft,
      structure: [{ label: "Roto", fromMs: 4000, toMs: 2000, note: "Retrocede." }],
    }),
    null,
  );
  assert.equal(
    parseReelAnalysisDraft({
      ...draft,
      delivery: { claim: "Sin respaldo", evidence: [] },
    }),
    null,
  );
});

test("el análisis guardado exige metadatos y transcripción válidos", () => {
  assert.equal(
    parseReelAnalysis({
      ...draft,
      pipelineVersion: "reel-v1",
      completedAt: "2026-09-27T20:00:00Z",
      transcript: [{ atMs: 0, quote: "Hay una métrica" }],
    })?.transcript[0].quote,
    "Hay una métrica",
  );
  assert.equal(parseReelAnalysis({ ...draft, transcript: [] }), null);
});

test("un análisis de Reel hecho con el modelo de respaldo no queda marcado como viejo", () => {
  assert.equal(
    isAnalysisOutdated({ pipelineVersion: `${ANALYSIS_PIPELINE_VERSION}:fallback=gpt:modality=transcript` }),
    false,
  );
  assert.equal(isAnalysisOutdated({ pipelineVersion: "reel-v4-old" }), true);
});
