import "server-only";

import { generateAnthropicJson } from "@/lib/ai/anthropic-json";
import { generateGeminiVideoJson } from "@/lib/ai/gemini-json";
import { normalizeAiFailure } from "@/lib/ai/provider-error";
import { transcribeReel } from "@/lib/ai/groq-transcription";
import { downloadReelVideo } from "@/lib/ai/reel-media";
import {
  GEMINI_REEL_ANALYSIS_SCHEMA,
  ANALYSIS_PIPELINE_VERSION,
  estimateSpeakingPaceWpm,
  parseGeneratedReelAnalysisDraft,
  type ReelAnalysis,
} from "@/lib/content/analysis";
import type { RankedContentItem } from "@/lib/content/library";
import { getFreshInstagramMediaSource } from "@/lib/data/instagram-media-source";
import { ANALYSIS_MODEL } from "@/lib/ai/models";

const GEMINI_MODEL = ANALYSIS_MODEL;

export async function analyzeReel(
  workspaceId: string,
  item: RankedContentItem,
  existingTranscript?: ReelAnalysis["transcript"],
): Promise<ReelAnalysis> {
  const source = await getFreshInstagramMediaSource(workspaceId, item.id);
  if (!source?.mediaUrl) throw new Error("fresh_media_unavailable");

  const video = await downloadReelVideo(source.mediaUrl);
  const transcript =
    existingTranscript && existingTranscript.length > 0
      ? existingTranscript
      : await transcribeReel(video, requireSecret("GROQ_API_KEY"));
  const prompt = buildPrompt(item, transcript);
  const { value: rawDraft, model, modality } = await generateReelAnalysis({
    video,
    prompt,
    thumbnailUrl: source.thumbnailUrl ?? item.thumbnailUrl,
  });
  const draft = parseGeneratedReelAnalysisDraft(rawDraft);
  if (!draft) throw new Error("gemini_invalid_analysis");

  return {
    pipelineVersion: pipelineVersion(ANALYSIS_PIPELINE_VERSION, model, modality),
    completedAt: new Date().toISOString(),
    ...draft,
    transcript,
  };
}

async function generateReelAnalysis({
  video,
  prompt,
  thumbnailUrl,
}: {
  video: Buffer;
  prompt: string;
  thumbnailUrl: string | null;
}) {
  try {
    const result = await generateGeminiVideoJson({
      apiKey: requireSecret("GEMINI_API_KEY"),
      model: GEMINI_MODEL,
      video,
      prompt,
      schema: GEMINI_REEL_ANALYSIS_SCHEMA,
    });
    return { ...result, modality: "full-video" as const };
  } catch (primaryError) {
    const failure = normalizeAiFailure(primaryError);
    console.warn(JSON.stringify({
      event: "ai_provider_fallback",
      provider: "anthropic",
      fromModel: GEMINI_MODEL,
      reason: failure?.kind ?? "unknown",
      modality: thumbnailUrl ? "transcript+cover" : "transcript",
    }));

    try {
      const result = await generateAnthropicJson({
        prompt: buildReducedVisualPrompt(prompt, Boolean(thumbnailUrl)),
        schema: GEMINI_REEL_ANALYSIS_SCHEMA,
        images: thumbnailUrl ? [{ data: new URL(thumbnailUrl), label: "Portada disponible del Reel:" }] : [],
      });
      return {
        ...result,
        modality: thumbnailUrl ? "transcript+cover" as const : "transcript" as const,
      };
    } catch (fallbackError) {
      const fallbackFailure = normalizeAiFailure(fallbackError, "anthropic");
      if (fallbackFailure?.kind === "authentication" || fallbackFailure?.kind === "configuration") {
        throw primaryError;
      }
      throw fallbackError;
    }
  }
}

function buildReducedVisualPrompt(prompt: string, hasThumbnail: boolean) {
  return `${prompt}\n\nMODO DE RESPALDO: no recibiste el video completo. Recibiste la transcripción con\n` +
    `timestamps y ${hasThumbnail ? "una imagen de portada" : "ninguna imagen"}. No afirmes haber observado movimiento, edición,\n` +
    `postura, sonido ni texto en pantalla fuera de esa evidencia. En executionReview omití dimensiones\n` +
    `que no puedan sostenerse. El reelMap puede apoyarse en los timestamps de la transcripción, pero\n` +
    `visual y onScreenText deben quedar vacíos cuando no sean comprobables.`;
}

function pipelineVersion(base: string, model: string, modality: "full-video" | "transcript+cover" | "transcript") {
  if (model === GEMINI_MODEL && modality === "full-video") return base;
  return `${base}:fallback=${model}:modality=${modality}`;
}

function buildPrompt(item: RankedContentItem, transcript: ReelAnalysis["transcript"]) {
  const estimatedSpeakingPaceWpm = estimateSpeakingPaceWpm(transcript);
  const context = {
    caption: item.caption,
    metrics: {
      views: item.views,
      reach: item.reach,
      interactions: item.interactions,
      likes: item.likes,
      comments: item.comments,
      saves: item.saves,
      shares: item.shares,
      averageWatchTimeMs: item.averageWatchTimeMs,
      totalWatchTimeMs: item.totalWatchTimeMs,
      skipRate: item.skipRate,
      multiplierAgainstAccountMedian: item.multiplier,
      estimatedSpeakingPaceWpm,
    },
    transcript,
  };

  return `
Actuá como director de contenido de un creador o emprendedor. Escribí en español
rioplatense claro, directo y práctico. El creador ya conoce el tema, el guion y lo que
dijo: NO se los resumas, NO describas la estructura y NO le expliques cuál fue su promesa.
Eso es material interno para razonar, no una conclusión útil.

Tu trabajo es responder:
- qué señales ayudan a explicar el rendimiento observado;
- qué fortaleció o frenó la pieza y por qué importa;
- dónde podría perder atención, diferenciando dato, observación e hipótesis;
- qué aprendizaje puede trasladar a sus próximos contenidos, aunque hablen de otro tema.

Reglas del diagnóstico:
- performance.verdict expresa la lectura principal del rendimiento, no el tema del video.
- Si multiplierAgainstAccountMedian es null, no afirmes que rindió mejor o peor que lo
  habitual. Si una métrica es null, no la conviertas en cero.
- findings debe contener fortalezas, fricciones u oportunidades que cambien una decisión.
  "Usa un gancho", "presenta una métrica" o "luego explica el proceso" son descripciones
  inútiles y están prohibidas. Explicá el efecto probable y por qué importa.
- Rechazá cualquier conclusión que pudiera escribirse sin mirar este video y estas métricas.
  No premies por defecto la claridad, la energía, el hook ni el CTA: señalá solamente lo
  que tenga una consecuencia práctica comprobable o una hipótesis concreta para validar.
- attentionHypotheses puede conectar omisión inicial, tiempo medio, duración percibida,
  densidad verbal, cambios visuales y claridad. No afirmes que la gente abandonó en un
  segundo concreto: Instagram no entrega una curva de retención por segundo.
- confidence es high sólo con una métrica directamente compatible y evidencia visual o
  verbal; medium cuando convergen varias señales; low cuando es una prueba razonable.

Cada elemento de actions debe ser aplicable sin volver a interpretar el informe:
- devolvé una lista única y usá kind para incluir una o dos acciones keep, change y test;
- title empieza con un verbo y dice qué hacer;
- fromMs y toMs indican el tramo de ESTA pieza que originó el aprendizaje;
- why conecta la acción con el diagnóstico o una métrica, no repite el contenido;
- how enseña una regla o procedimiento reutilizable en videos futuros, incluso si cambia
  el tema. No asumas que el creador volverá a subir o grabar este mismo Reel;
- metricToWatch nombra la métrica y qué cambio observar en los próximos Reels;
- evidence señala uno o más momentos comprobables del video.

executionReview inspecciona cómo se ejecutó la pieza: voz, velocidad y pausas, postura o
lenguaje corporal, composición/entorno, edición y sonido. Incluí sólo dimensiones que
produzcan una conclusión útil; no llenes casilleros con observaciones obvias. Para cada una,
explicá el efecto probable y una mejora transferible. El ritmo estimado en palabras por
minuto es aproximado y debe leerse junto con pausas, claridad y densidad, no como una nota.
Podés contrastar contra principios profesionales de contenido corto —audio inteligible,
pausas intencionales, mirada, jerarquía visual y cortes con función—, pero no inventes
promedios de industria ni afirmes qué hacen los referentes sin un dataset comparativo.

reelMap divide el Reel completo en entre tres y ocho tramos cronológicos, sin solaparlos.
No es otro informe: es un índice temporal para volver al video. En cada tramo:
- role indica su función principal: hook, context, development, proof, transition o cta;
- label la nombra en pocas palabras y fromMs/toMs delimitan el momento real;
- visual describe únicamente lo que se ve en ese tramo;
- onScreenText copia el texto relevante visible o devuelve una cadena vacía si no hay;
- finding resume en una frase qué aporta o frena ese tramo;
- recommendation da una acción breve y transferible a futuros videos.
Cubrir el recorrido completo desde el arranque hasta el cierre. Priorizá cambios reales de
idea, escena, prueba o función narrativa; no cortes por cada oración ni repitas párrafos del
diagnóstico. Los tiempos deben avanzar y toda lectura visual debe ser comprobable al saltar
al comienzo del tramo.

reversionIdeas es opcional en la práctica: devolvé una lista vacía si no hay una oportunidad
clara. Si vale la pena reutilizar esta pieza, incluí como máximo dos cambios específicos bajo
la lógica "si decidís reversionarla". Estas ideas nunca reemplazan los aprendizajes generales.

Mirá el video completo y usá tanto imagen como audio. El ritmo estimado de habla es una
aproximación derivada de los timestamps de la transcripción: sirve como señal, no como
medición exacta. No inventes cifras ni causalidad. Toda afirmación importante debe tener
evidencia con atMs y una descripción breve del momento que la respalda.

Contexto medido por Zenovi:
${JSON.stringify(context)}
`.trim();
}

function requireSecret(name: "GROQ_API_KEY" | "GEMINI_API_KEY") {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`missing_${name.toLowerCase()}`);
  return value;
}
