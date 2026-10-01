/**
 * Qué modelo hace cada cosa. Todos los de Claude van directo a Anthropic y se pagan en
 * la consola de Claude; Gemini (análisis de video) y Groq (transcripción) tienen sus claves.
 */

/** Conversa el Director: el Sonnet más nuevo. */
export const DIRECTOR_MODEL = "claude-sonnet-5-5";
/** Lo que no se ve —títulos de chats, resúmenes— va por el modelo rápido. */
export const UTILITY_MODEL = "claude-haiku-4-5";
/** Si Gemini no puede analizar un Reel o una secuencia, lo intenta Claude con los fotogramas. */
export const ANALYSIS_FALLBACK_MODEL = "claude-sonnet-5-5";
