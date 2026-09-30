/**
 * Prueba comprensión visual sobre un Reel real sin guardar resultados.
 *
 * Envía el video inline: no crea un archivo en Gemini Files ni escribe en Supabase. La
 * salida está acotada por esquema para comprobar que el modelo puede sostener evidencia
 * temporal, no sólo redactar una devolución convincente.
 *
 * Uso: npm run bench:multimodal -- @usuario
 */
import {
  loadFreshInstagramReel,
  requireEnv,
} from "./lib/fresh-instagram-reel.mjs";
import {
  GEMINI_REEL_ANALYSIS_SCHEMA,
  parseReelAnalysisDraft,
} from "../lib/content/analysis.ts";
import { generateGeminiVideoJson } from "../lib/ai/gemini-json.ts";

const MODEL = process.argv[3] ?? "gemini-3.8-flash";
const wanted = process.argv[2]?.replace(/^@/, "") ?? null;
const PROMPT = `
Analizá este Reel como evidencia audiovisual para un creador de contenido. Escribí en
español rioplatense claro. No inventes métricas ni contexto exterior al video.

Necesitamos comprobar visión, no una opinión genérica:
- identificá el hook visual y verbal de los primeros segundos;
- transcribí sólo los textos importantes que realmente aparecen en pantalla;
- separá los cambios de escena o recurso visual;
- describí ritmo, forma de hablar y CTA;
- toda afirmación debe citar atMs en milisegundos y decir qué se ve o se escucha;
- si algo no se puede comprobar, indicalo como limitación.
`.trim();

const { account, reel, unavailableReels, video, downloadMs } = await loadFreshInstagramReel(
  wanted,
).catch((error) => exit(error.message));

if (unavailableReels > 0) {
  console.log(
    `Meta no entregó el archivo de ${unavailableReels} ${unavailableReels === 1 ? "Reel" : "Reels"}; uso el siguiente disponible.\n`,
  );
}

console.log(`Cuenta @${account.username}`);
console.log(`Reel del ${reel.timestamp?.slice(0, 10)} · ${reel.permalink ?? reel.id}`);
console.log(
  `Video bajado: ${(video.length / 1024 / 1024).toFixed(1)} MB en ${downloadMs} ms`,
);
console.log(`Modelo: ${MODEL}\n`);

const startedAt = Date.now();
const generated = await generateGeminiVideoJson({
  apiKey: requireEnv("GEMINI_API_KEY"),
  model: MODEL,
  video,
  prompt: PROMPT,
  schema: GEMINI_REEL_ANALYSIS_SCHEMA,
}).catch((error) => exit(error.message));
const analysis = generated.value;
if (!parseReelAnalysisDraft(analysis)) {
  exit("Gemini devolvió JSON, pero no cumple el contrato del análisis.");
}

console.log(`Terminó en ${((Date.now() - startedAt) / 1000).toFixed(1)} s`);
console.log(`Tokens: ${formatUsage(generated.usage)}\n`);
console.log(JSON.stringify(analysis, null, 2));
console.log("\nQué comprobar mirando el Reel:");
console.log("  1. ¿El texto en pantalla existe y aparece en ese momento?");
console.log("  2. ¿Los cambios de escena no son inventados?");
console.log("  3. ¿Distingue lo visual de lo que solamente se escucha?");
console.log("  4. ¿Cada conclusión importante trae una evidencia comprobable?");

function formatUsage(usage) {
  if (!usage) return "sin información";
  const parts = [
    `${usage.input ?? "?"} entrada`,
    `${usage.output ?? "?"} salida`,
  ];
  if (usage.thoughts) parts.push(`${usage.thoughts} razonamiento`);
  parts.push(`${usage.total ?? "?"} total`);
  return parts.join(" · ");
}

function exit(message) {
  console.error(message);
  process.exit(1);
}
