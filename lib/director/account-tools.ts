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
  type ContentSort,
} from "@/lib/content/library";
import { getContentAnalysis } from "@/lib/data/content-analysis";
import { getInstagramContentLibrary } from "@/lib/data/instagram-content";
import { getInstagramDashboardData } from "@/lib/data/instagram-dashboard";
import { accountSnapshot, analysisSnapshot, pieceSnapshot } from "./account-snapshots";

const SORTS: ContentSort[] = ["recent", "views", "reach", "interactions", "likes", "comments", "saves", "shares", "multiplier"];
const FORMATS = ["reel", "publication", "story", "todos"] as const;
const PERIODS = [7, 30, 90] as const;

/**
 * Lo que el Director puede leer de la cuenta. Todo sale de la biblioteca y las métricas del
 * workspace de quien conversa, cargadas con su sesión (RLS): una pieza se busca dentro de
 * esa biblioteca, nunca por id suelto en la base, así un id ajeno no devuelve nada.
 * Son sólo lecturas: ninguna herramienta escribe.
 */
export function buildAccountTools(workspaceId: string): ToolSet {
  // Una conversación puede llamar varias herramientas: la biblioteca se carga una sola vez.
  let library: ReturnType<typeof getInstagramContentLibrary> | null = null;
  const loadLibrary = () => (library ??= getInstagramContentLibrary(workspaceId));

  return {
    buscar_contenido: tool({
      description:
        "Lista piezas publicadas de la cuenta con sus métricas reales y cuánto rindieron contra lo habitual de su formato. Usala para responder con números, encontrar lo que mejor o peor funcionó, o buscar una pieza por su texto.",
      inputSchema: jsonSchema<{ formato: (typeof FORMATS)[number]; ordenar_por: ContentSort; cantidad: number; texto?: string }>({
        type: "object",
        properties: {
          formato: { type: "string", enum: [...FORMATS], description: "reel, publication (posts y carruseles), story o todos" },
          ordenar_por: { type: "string", enum: SORTS, description: "recent = más nuevas; multiplier = las que más superaron lo habitual" },
          cantidad: { type: "integer", minimum: 1, maximum: 10 },
          texto: { type: "string", maxLength: 80, description: "Palabras que aparecen en el caption, para buscar una pieza puntual" },
        },
        required: ["formato", "ordenar_por", "cantidad"],
        additionalProperties: false,
      }),
      execute: async ({ formato, ordenar_por, cantidad, texto }) => {
        const loaded = await loadLibrary();
        if (!loaded) return { error: "La cuenta de Instagram no está conectada." };
        const ranked = formato === "todos" ? rankAllFormats(loaded.items) : buildCohort(loaded.items, formato as ContentKind);
        const found = sortContentItems(searchContentItems(ranked, texto ?? ""), ordenar_por, "desc");
        return { total: found.length, piezas: found.slice(0, Math.min(Math.max(cantidad, 1), 10)).map(pieceSnapshot) };
      },
    }),

    ver_pieza: tool({
      description:
        "Muestra una pieza en detalle: sus métricas, cómo rindió contra lo habitual y, si fue analizada, el diagnóstico y el plan de acción guardados. Usá un id que haya devuelto buscar_contenido.",
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
        const analysis = item.kind === "reel" ? await getContentAnalysis(item.id) : null;
        return {
          pieza: pieceSnapshot(ranked),
          analisis:
            analysis?.status === "ready" && isActionableAnalysis(analysis.analysis)
              ? analysisSnapshot(analysis.analysis)
              : "Sin análisis guardado.",
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
        return accountSnapshot(buildReportModel({ dashboard, contentItems: loaded?.items ?? [], days }));
      },
    }),
  };
}
