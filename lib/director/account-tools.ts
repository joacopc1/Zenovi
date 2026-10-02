import "server-only";

import { jsonSchema, tool, type ToolSet } from "ai";
import { buildReportModel } from "@/lib/analytics/report-model";
import { isActionableAnalysis } from "@/lib/content/analysis";
import {
  buildCohort,
  rankAllFormats,
  searchContentItems,
  sortContentItems,
  type ContentKind,
  type RankedContentItem,
  type ContentSort,
} from "@/lib/content/library";
import type { ReelScript } from "@/lib/content/script";
import { buildStorySequences } from "@/lib/content/story-sequences";
import { getContentAnalysis } from "@/lib/data/content-analysis";
import { getContentScript, getReadyScripts } from "@/lib/data/content-script";
import { getInstagramContentLibrary } from "@/lib/data/instagram-content";
import { getInstagramDashboardData } from "@/lib/data/instagram-dashboard";
import { getReadyStoryAnalyses } from "@/lib/data/story-analysis";
import {
  accountSnapshot,
  analysisSnapshot,
  isWithinDays,
  pieceSnapshot,
  scriptSnapshot,
  sequenceSnapshot,
} from "./account-snapshots";

const SORTS: ContentSort[] = ["recent", "views", "reach", "interactions", "likes", "comments", "saves", "shares", "multiplier"];
const FORMATS = ["reel", "publication", "story", "todos"] as const;
const PERIODS = [7, 30, 90] as const;

/**
 * Lo que el Director puede leer de la cuenta. Todo sale de la biblioteca y las métricas del
 * workspace de quien conversa, cargadas con su sesión (RLS): una pieza se busca dentro de
 * esa biblioteca, nunca por id suelto en la base, así un id ajeno no devuelve nada.
 * Son sólo lecturas: ninguna herramienta escribe.
 */
export function buildAccountTools(workspaceId: string, timeZone: string): ToolSet {
  // Una conversación puede llamar varias herramientas: la biblioteca se carga una sola vez.
  let library: ReturnType<typeof getInstagramContentLibrary> | null = null;
  const loadLibrary = () => (library ??= getInstagramContentLibrary(workspaceId));
  let scripts: ReturnType<typeof getReadyScripts> | null = null;
  const loadScripts = () => (scripts ??= getReadyScripts(workspaceId));

  return {
    buscar_contenido: tool({
      description:
        "Lista piezas publicadas de la cuenta con sus métricas reales y cuánto rindieron contra lo habitual de su formato. Usala para responder con números, encontrar lo que mejor o peor funcionó, o buscar una pieza por su caption o por lo que se dice en el video.",
      inputSchema: jsonSchema<{
        formato: (typeof FORMATS)[number];
        ordenar_por: ContentSort;
        cantidad: number;
        texto?: string;
        desde?: string;
        hasta?: string;
      }>({
        type: "object",
        properties: {
          formato: { type: "string", enum: [...FORMATS], description: "reel, publication (posts y carruseles), story o todos" },
          ordenar_por: { type: "string", enum: SORTS, description: "recent = más nuevas; multiplier = las que más superaron lo habitual" },
          cantidad: { type: "integer", minimum: 1, maximum: 10 },
          texto: { type: "string", maxLength: 80, description: "Palabras del caption o de lo que se dice en el Reel (si tiene guion), para buscar una pieza puntual" },
          desde: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", description: "Publicadas desde este día, inclusive (AAAA-MM-DD, en la zona horaria del creador)" },
          hasta: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", description: "Publicadas hasta este día, inclusive (AAAA-MM-DD). Para un día puntual, el mismo valor en desde y hasta" },
        },
        required: ["formato", "ordenar_por", "cantidad"],
        additionalProperties: false,
      }),
      execute: async ({ formato, ordenar_por, cantidad, texto, desde, hasta }) => {
        const loaded = await loadLibrary();
        if (!loaded) return { error: "La cuenta de Instagram no está conectada." };
        const ranked = formato === "todos" ? rankAllFormats(loaded.items) : buildCohort(loaded.items, formato as ContentKind);
        const inRange = ranked.filter((item) => isWithinDays(item.postedAt, desde, hasta, timeZone));
        const matches = texto?.trim() ? withSpokenMatches(inRange, texto, await loadScripts()) : inRange;
        const found = sortContentItems(matches, ordenar_por, "desc");
        return { total: found.length, piezas: found.slice(0, Math.min(Math.max(cantidad, 1), 10)).map((piece) => pieceSnapshot(piece, timeZone)) };
      },
    }),

    ver_pieza: tool({
      description:
        "Muestra una pieza en detalle: sus métricas (en Reels, también retención y cuánto lo saltearon), cómo rindió contra lo habitual, lo que se dice en el Reel partido en gancho, desarrollo y cierre si tiene guion, y el diagnóstico y el plan de acción si fue analizada. Usá un id que haya devuelto buscar_contenido.",
      inputSchema: jsonSchema<{ id: string }>({
        type: "object",
        properties: { id: { type: "string", maxLength: 64 } },
        required: ["id"],
        additionalProperties: false,
      }),
      execute: async ({ id }) => {
        const loaded = await loadLibrary();
        const item = loaded?.items.find((candidate) => candidate.id === id);
        if (!item || !loaded) return { error: "No encontré esa pieza en la cuenta." };
        const ranked = buildCohort(loaded.items, item.kind).find((candidate) => candidate.id === id) ?? { ...item, multiplier: null };
        const [analysis, script] = item.kind === "reel"
          ? await Promise.all([getContentAnalysis(item.id), getContentScript(item.id)])
          : [null, null];
        return {
          pieza: pieceSnapshot(ranked, timeZone),
          guion: script?.status === "ready" ? scriptSnapshot(script.script) : "Sin guion: el creador puede generarlo desde el Reel.",
          analisis:
            analysis?.status === "ready" && isActionableAnalysis(analysis.analysis)
              ? analysisSnapshot(analysis.analysis)
              : "Sin análisis guardado.",
        };
      },
    }),

    ver_historias: tool({
      description:
        "Las secuencias de Historias (todas las de un mismo día) con cuántos las empezaron, qué parte llegó al final, cuántos se pierden por Historia, la retención Historia por Historia, respuestas y visitas al perfil cada 100 personas, cada número contra lo habitual de la cuenta, el texto de cada Historia y el análisis si existe. Usala para cualquier pregunta sobre Historias.",
      inputSchema: jsonSchema<{ cantidad: number; desde?: string; hasta?: string }>({
        type: "object",
        properties: {
          cantidad: { type: "integer", minimum: 1, maximum: 10, description: "Cuántas secuencias, de la más nueva a la más vieja" },
          desde: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", description: "Secuencias desde este día, inclusive (AAAA-MM-DD)" },
          hasta: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", description: "Secuencias hasta este día, inclusive (AAAA-MM-DD)" },
        },
        required: ["cantidad"],
        additionalProperties: false,
      }),
      execute: async ({ cantidad, desde, hasta }) => {
        const loaded = await loadLibrary();
        if (!loaded) return { error: "La cuenta de Instagram no está conectada." };
        // Lo habitual se calcula sobre todas las secuencias; el filtro sólo elige cuáles mostrar.
        const sequences = buildStorySequences(buildCohort(loaded.items, "story"), timeZone);
        const chosen = sequences
          .filter((sequence) => isWithinDays(sequence.startedAt, desde, hasta, timeZone))
          .slice(0, Math.min(Math.max(cantidad, 1), 10));
        if (chosen.length === 0) return { total: 0, secuencias: [] };
        const analyses = await getReadyStoryAnalyses(chosen.map((sequence) => sequence.id));
        return {
          total: chosen.length,
          secuencias: chosen.map((sequence) => sequenceSnapshot(sequence, sequences, timeZone, analyses.get(sequence.id) ?? null)),
        };
      },
    }),

    resumen_cuenta: tool({
      description:
        "Totales de la cuenta en un período (views, interacciones, guardados, visitas al perfil, seguidores, publicaciones) contra el período anterior, y las piezas que más rindieron. Son los mismos números que muestra Analíticas.",
      inputSchema: jsonSchema<{ dias: (typeof PERIODS)[number] }>({
        type: "object",
        properties: { dias: { type: "integer", enum: [...PERIODS] } },
        required: ["dias"],
        additionalProperties: false,
      }),
      execute: async ({ dias }) => {
        const [dashboard, loaded] = await Promise.all([getInstagramDashboardData(workspaceId), loadLibrary()]);
        if (!dashboard) return { error: "Todavía no hay métricas sincronizadas de la cuenta." };
        const days = PERIODS.includes(dias) ? dias : 30;
        return accountSnapshot(buildReportModel({ dashboard, contentItems: loaded?.items ?? [], days }), timeZone);
      },
    }),
  };
}

/** Las piezas cuyo caption o guion menciona el texto, en el orden en que llegaron. */
function withSpokenMatches(items: RankedContentItem[], text: string, scripts: Map<string, ReelScript>) {
  const needle = text.trim().toLocaleLowerCase("es");
  const byCaption = new Set(searchContentItems(items, text).map((item) => item.id));
  return items.filter((item) =>
    byCaption.has(item.id)
    || scripts.get(item.id)?.transcript.some((moment) => moment.quote.toLocaleLowerCase("es").includes(needle)),
  );
}
