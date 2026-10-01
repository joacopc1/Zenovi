import "server-only";

import { generateAnthropicJson } from "@/lib/ai/anthropic-json";
import { generateGeminiMediaJson } from "@/lib/ai/gemini-json";
import { normalizeAiFailure } from "@/lib/ai/provider-error";
import { downloadStorySequenceMedia } from "@/lib/ai/story-media";
import {
  GEMINI_STORY_ANALYSIS_SCHEMA,
  parseStorySequenceAnalysis,
  STORY_ANALYSIS_PIPELINE_VERSION,
  type StorySequenceAnalysis,
} from "@/lib/content/story-analysis";
import type { StorySequence } from "@/lib/content/story-sequences";
import { getFreshInstagramMediaSource } from "@/lib/data/instagram-media-source";

const GEMINI_MODEL = "gemini-3.8-flash";

export async function analyzeStorySequence(
  workspaceId: string,
  sequence: StorySequence,
): Promise<StorySequenceAnalysis> {
  const sources = await Promise.all(
    sequence.stories.map(async (story, index) => {
      // Viva, Meta entrega la URL vigente; vencida, sólo queda la copia propia que trae la biblioteca.
      const fresh = await getFreshInstagramMediaSource(workspaceId, story.id);
      const mediaUrl = fresh?.mediaUrl ?? story.mediaUrl;
      const thumbnailUrl = fresh?.thumbnailUrl ?? story.thumbnailUrl;
      const url = mediaUrl ?? thumbnailUrl;
      if (!url) throw new Error("fresh_story_media_unavailable");
      // Un video de más de 30 días ya no se guarda: queda su portada, que se analiza como imagen.
      const isVideo = story.mediaType === "VIDEO" && mediaUrl !== null;
      return {
        url,
        fallbackImageUrl: isVideo ? thumbnailUrl : url,
        type: isVideo ? "video" as const : "image" as const,
        name: `story-${index + 1}`,
      };
    }),
  );
  const prompt = buildPrompt(sequence);
  const { value, model, modality } = await generateStoryAnalysis({
    sources,
    prompt,
  });
  const analysis = parseStorySequenceAnalysis({
    pipelineVersion: pipelineVersion(STORY_ANALYSIS_PIPELINE_VERSION, model, modality),
    completedAt: new Date().toISOString(),
    ...(isRecord(value) ? value : {}),
  });
  if (!analysis) throw new Error("gemini_invalid_story_analysis");
  return analysis;
}

async function generateStoryAnalysis({
  sources,
  prompt,
}: {
  sources: Array<{
    url: string;
    fallbackImageUrl: string | null;
    type: "image" | "video";
    name: string;
  }>;
  prompt: string;
}) {
  try {
    const media = await downloadStorySequenceMedia(sources);
    const result = await generateGeminiMediaJson({
      apiKey: requireSecret("GEMINI_API_KEY"),
      model: GEMINI_MODEL,
      media,
      prompt,
      schema: GEMINI_STORY_ANALYSIS_SCHEMA,
    });
    return { ...result, modality: "full-media" as const };
  } catch (primaryError) {
    const fallbackImageUrls = sources.map((source) => source.fallbackImageUrl);
    const images = fallbackImageUrls.flatMap((url, index) => url ? [{
      data: new URL(url),
      label: `Historia ${index + 1}:`,
    }] : []);
    const failure = normalizeAiFailure(primaryError);
    console.warn(JSON.stringify({
      event: "ai_provider_fallback",
      provider: "anthropic",
      fromModel: GEMINI_MODEL,
      reason: failure?.kind ?? "unknown",
      modality: images.length === sources.length ? "all-frames" : "partial-frames",
    }));

    try {
      const result = await generateAnthropicJson({
        prompt: buildReducedStoryPrompt(prompt, sources.length, fallbackImageUrls),
        schema: GEMINI_STORY_ANALYSIS_SCHEMA,
        images,
      });
      return {
        ...result,
        modality: images.length === sources.length
          ? "all-frames" as const
          : "partial-frames" as const,
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

function buildReducedStoryPrompt(
  prompt: string,
  sequenceLength: number,
  imageUrls: Array<string | null>,
) {
  const unavailable = Array.from({ length: sequenceLength }, (_, index) => index)
    .flatMap((index) => imageUrls[index] ? [] : [index + 1]);
  return `${prompt}\n\nMODO DE RESPALDO: cada imagen recibida está identificada con su número de Historia. Para los\n` +
    `videos sólo recibiste su portada, no el movimiento ni el audio. No atribuyas edición, voz o\n` +
    `acciones que una imagen fija no demuestre.${unavailable.length > 0
      ? ` No hay evidencia visual disponible para las Historias ${unavailable.join(", ")}; basate sólo en sus métricas.`
      : ""}`;
}

function pipelineVersion(
  base: string,
  model: string,
  modality: "full-media" | "all-frames" | "partial-frames",
) {
  if (model === GEMINI_MODEL && modality === "full-media") return base;
  return `${base}:fallback=${model}:modality=${modality}`;
}

function buildPrompt(sequence: StorySequence) {
  const context = sequence.stories.map((story, index) => ({
    slideNumber: index + 1,
    postedAt: story.postedAt,
    metrics: {
      views: story.views,
      reach: story.reach,
      replies: story.replies,
      shares: story.shares,
      follows: story.follows,
      profileVisits: story.profileVisits,
      profileActivity: story.profileActivity,
      tapForward: story.storyForwardTaps,
      tapBack: story.storyBackTaps,
      exits: story.storyExits,
      nextStory: story.storyNextSwipes,
    },
  }));

  return `
Actuá como director de contenido y ventas de una marca personal. Analizá la secuencia
completa de Historias en español rioplatense claro, directo y práctico.

La persona ya sabe qué publicó. No resumas cada Historia como conclusión principal ni
repitas el texto visible sin explicar su efecto. Tu trabajo es detectar qué ayudó o frenó
la atención y la intención comercial, y convertirlo en decisiones para futuras secuencias.

Mirá cada imagen o video en el orden entregado. Leé el texto en pantalla, CTA, oferta,
prueba, jerarquía visual, continuidad y carga cognitiva. Cruzá eso con las métricas de la
slide correspondiente. Un dato null está ausente: nunca lo conviertas en cero.

Reglas:
- La caída entre slides y completionRate se leen en personas (reach), no en views: una view
  se vuelve a contar cuando alguien retrocede o la mira de nuevo. Hablá de "personas" y de
  "completaron la secuencia", que es el idioma del creador. Aun así, reach por slide no
  demuestra que sean exactamente las mismas personas: puede haber entradas tardías.
- No atribuyas causalidad sólo porque bajaron las personas. Presentá hipótesis concretas y
  señalá qué evidencia visual y métrica las sostiene.
- Replies, visitas al perfil y follows son señales de intención más cercanas al negocio;
  views por sí solas no prueban ventas.
- tapForward indica avance dentro de esta secuencia, tapBack una revisión, exits una salida
  de Stories y nextStory el salto a la Historia de otra cuenta.
- diagnosis debe decir qué decisión cambia, no describir el tema de la secuencia.
- findings incluye solamente fortalezas, fricciones u oportunidades accionables.
- actions debe contener al menos una keep, una change y una test. Cada título empieza con
  un verbo; how enseña una regla reutilizable en futuras secuencias, aunque cambie el tema;
  metricToWatch dice qué mirar para validar el aprendizaje.
- slides funciona como mapa: visibleText transcribe sólo el texto relevante que realmente
  aparece; visual describe lo comprobable; reading explica su función o fricción;
  recommendation da una mejora breve. Incluí exactamente una entrada por Historia y
  conservá su número.
- No inventes benchmarks de industria, ventas ni respuestas que las métricas no muestran.

Completaron la secuencia (reach de la última sobre reach de la primera, null si falta):
${JSON.stringify(sequence.completionRate)}

Métricas disponibles por Historia:
${JSON.stringify(context)}
  `.trim();
}

function requireSecret(name: "GEMINI_API_KEY") {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`missing_${name.toLowerCase()}`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
