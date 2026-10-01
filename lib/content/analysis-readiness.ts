import type { StorySequence } from "./story-sequences";

/**
 * El análisis con IA cruza el contenido con sus métricas y gasta créditos: con datos que
 * todavía no dicen nada, sólo produce conclusiones inventadas. Estas reglas deciden si ya
 * se puede pedir, y la acción del servidor las vuelve a comprobar.
 */
export const REEL_ANALYSIS_MIN_VIEWS = 100;
export const STORY_ANALYSIS_MIN_REACH = 50;
const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000;

export function reelAnalysisBlocker(views: number | null) {
  if (views === null || views < REEL_ANALYSIS_MIN_VIEWS) {
    return `Se puede analizar cuando el Reel llegue a ${REEL_ANALYSIS_MIN_VIEWS} visualizaciones.`;
  }
  return null;
}

export function storyAnalysisBlocker(sequence: StorySequence, now = new Date()) {
  // Mientras alguna Historia sigue viva, sus números siguen creciendo.
  if (now.getTime() - Date.parse(sequence.endedAt) < STORY_LIFETIME_MS) {
    return "Se puede analizar cuando terminen las 24 h de la última Historia y sus métricas estén completas.";
  }
  const started = sequence.stories[0].reach;
  if (started === null || started < STORY_ANALYSIS_MIN_REACH) {
    return `Se puede analizar cuando la secuencia llegue a ${STORY_ANALYSIS_MIN_REACH} personas: con menos, los porcentajes no dicen nada.`;
  }
  return null;
}
