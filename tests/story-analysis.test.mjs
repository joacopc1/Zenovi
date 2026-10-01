import assert from "node:assert/strict";
import test from "node:test";
import {
  STORY_ANALYSIS_PIPELINE_VERSION,
  isStoryAnalysisOutdated,
  parseStorySequenceAnalysis,
  readStoryAnalysisState,
} from "../lib/content/story-analysis.ts";

test("acepta un análisis visual completo de una secuencia", () => {
  const analysis = parseStorySequenceAnalysis(exampleAnalysis());

  assert.equal(analysis?.diagnosis.verdict, "La prueba aparece después de la mayor caída");
  assert.equal(analysis?.slides.length, 2);
  assert.equal(analysis?.actions[0].kind, "change");
});

test("rechaza un mapa que no identifica sus Historias", () => {
  const value = exampleAnalysis();
  value.slides[0].slideNumber = 0;

  assert.equal(parseStorySequenceAnalysis(value), null);
});

test("una fila lista devuelve el documento y una ausencia queda sin pedir", () => {
  assert.deepEqual(readStoryAnalysisState(null), { status: "not_requested" });
  assert.equal(readStoryAnalysisState({
    status: "ready",
    result: exampleAnalysis(),
    failureReason: null,
    canRetry: true,
    startedAt: null,
  }).status, "ready");
});

function exampleAnalysis() {
  return {
    pipelineVersion: "story-sequence-v1-gemini-3.8-flash",
    completedAt: "2026-09-30T15:00:00Z",
    diagnosis: {
      verdict: "La prueba aparece después de la mayor caída",
      explanation: "La primera Historia abre curiosidad, pero demora la evidencia.",
      confidence: "medium",
    },
    findings: [
      {
        kind: "friction",
        title: "La prueba llega tarde",
        insight: "La caída ocurre antes de mostrar el resultado.",
        impact: "Menos personas alcanzan el CTA.",
        slideNumbers: [1, 2],
      },
      {
        kind: "strength",
        title: "El CTA pide una sola acción",
        insight: "La palabra clave es fácil de responder.",
        impact: "Reduce fricción para iniciar una conversación.",
        slideNumbers: [2],
      },
    ],
    actions: [
      {
        kind: "change",
        title: "Adelantá la prueba",
        why: "La mayor caída sucede antes de verla.",
        how: "Mostrá el resultado en la segunda Historia.",
        metricToWatch: "views de la segunda Historia frente a la primera",
        slideNumbers: [1, 2],
      },
      {
        kind: "keep",
        title: "Conservá una sola palabra clave",
        why: "La respuesta pide poco esfuerzo.",
        how: "Usá una palabra vinculada al recurso ofrecido.",
        metricToWatch: "respuestas",
        slideNumbers: [2],
      },
      {
        kind: "test",
        title: "Probá abrir con el resultado",
        why: "Puede sostener más atención.",
        how: "Compará dos secuencias de longitud similar.",
        metricToWatch: "salidas en la primera Historia",
        slideNumbers: [1],
      },
    ],
    slides: [
      {
        slideNumber: 1,
        role: "opening",
        visibleText: "Todo lo que sé sobre crecer",
        visual: "Fondo negro y carpeta amarilla.",
        reading: "Abre un bucle, pero todavía no aporta prueba.",
        recommendation: "Mostrar el resultado antes.",
      },
      {
        slideNumber: 2,
        role: "cta",
        visibleText: "Respondé CLASES",
        visual: "Capturas del material y CTA blanco.",
        reading: "Hace tangible el recurso y pide una acción.",
        recommendation: "Conservar una sola palabra clave.",
      },
    ],
  };
}

test("un análisis hecho con el modelo de respaldo sigue vigente", () => {
  const analysis = {
    pipelineVersion: `${STORY_ANALYSIS_PIPELINE_VERSION}:fallback=gpt:modality=all-frames`,
    slides: [{}, {}, {}],
  };
  assert.equal(isStoryAnalysisOutdated(analysis, 3), false);
});

test("un análisis queda viejo si después se publicaron más Historias ese día", () => {
  const analysis = { pipelineVersion: STORY_ANALYSIS_PIPELINE_VERSION, slides: [{}, {}, {}] };
  assert.equal(isStoryAnalysisOutdated(analysis, 4), true);
});
