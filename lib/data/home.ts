import "server-only";

import { after } from "next/server";
import { DEFAULT_RANGE_DAYS, type RangeDays } from "@/lib/analytics/range";
import { buildReportModel } from "@/lib/analytics/report-model";
import { measureBrandDna } from "@/lib/brand/dna";
import { buildCohort, rankAllFormats } from "@/lib/content/library";
import { buildStorySequences } from "@/lib/content/story-sequences";
import { getBrandDna } from "@/lib/data/brand-dna";
import { getCreditBalance } from "@/lib/data/credit-balance";
import { getInstagramContentLibrary } from "@/lib/data/instagram-content";
import type { InstagramDashboardData } from "@/lib/data/instagram-dashboard";
import { getContentItems } from "@/lib/data/production";
import { buildActivityGrid, buildInsight, directorQuestions, parseInsightText, latestStories, needsAttention, pickTopPieces, upcomingDays } from "@/lib/home/home-model";
import { localDay, pieceLabel } from "@/lib/director/account-snapshots";
import { generateHomeInsight, getStoredInsight } from "@/lib/home/ai-insight";
import { readCadence } from "@/lib/production/cadence";
import { createClient } from "@/lib/supabase/server";

/** Un Reel se cuenta como "sin analizar" si salió en este período y todavía no tiene análisis. */
const ANALYSIS_LOOKBACK_DAYS = 30;
/** Unos ocho meses: alcanza para ver la constancia y llena el ancho de la card. */
const ACTIVITY_WEEKS = 36;

/**
 * Todo lo que muestra el Inicio, con las mismas cuentas que Analíticas, Contenido y
 * Producción: lo que el creador ve acá coincide con lo que ve al entrar a cada sección.
 */
export async function getHomeOverview(
  workspaceId: string,
  userId: string,
  dashboard: InstagramDashboardData,
  rangeDays: RangeDays = DEFAULT_RANGE_DAYS,
) {
  const today = localDay(new Date().toISOString());
  const [library, production, analyses, dna, credits, storedInsight] = await Promise.all([
    getInstagramContentLibrary(workspaceId),
    getContentItems(workspaceId),
    getAnalysisStates(workspaceId),
    getBrandDna(workspaceId),
    getCreditBalance(workspaceId),
    getStoredInsight(workspaceId, today),
  ]);
  const items = library?.items ?? [];
  const now = new Date();
  const week = buildReportModel({ dashboard, contentItems: items, days: 7 });
  const month = buildReportModel({ dashboard, contentItems: items, days: rangeDays });
  const topPieces = pickTopPieces(rankAllFormats(items), now);
  const standout = topPieces[0] ?? null;
  const cadence = readCadence(
    production,
    items.filter((item) => item.kind !== "story").map((item) => item.postedAt),
    now,
  );
  const stories = latestStories(buildStorySequences(buildCohort(items, "story")), now);
  const since = now.getTime() - ANALYSIS_LOOKBACK_DAYS * 86_400_000;
  const reelsWithoutAnalysis = items.filter(
    (item) => item.kind === "reel" && Date.parse(item.postedAt) >= since && !analyses.ready.has(item.id),
  ).length;
  const agendaDays = upcomingDays(now);

  // La lectura del día la escribe la IA una sola vez, después de responder: esta visita ve
  // la armada con datos y la próxima, la de la IA. Así abrir el Inicio nunca espera al modelo.
  if (!storedInsight.text && storedInsight.canStore) {
    const facts = {
      dias: 7,
      visualizaciones: { esta_semana: week.views.current, semana_anterior: week.views.previous },
      interacciones: { esta_semana: week.interactions.current, semana_anterior: week.interactions.previous },
      seguidores_ganados: week.followers?.change ?? null,
      mejor_pieza: standout
        ? { nombre: pieceLabel(standout), veces_su_habitual: standout.multiplier, visualizaciones: standout.views }
        : null,
      dias_sin_publicar: cadence.daysSinceLast,
      ideas_con_fecha_vencida: production.filter((item) => item.status !== "publicada" && item.targetDate !== null && item.targetDate < today).length,
      ultima_secuencia_de_historias: stories
        ? { historias: stories.stories, llegaron_al_final: stories.completion, lo_habitual: stories.habitualCompletion }
        : null,
    };
    after(() => generateHomeInsight({ workspaceId, userId, day: today, facts }));
  }

  return {
    week: [
      {
        label: "Visualizaciones",
        hint: "Cuántas veces se vio tu contenido en los últimos 7 días.",
        current: week.views.current,
        previous: week.views.previous,
      },
      {
        label: "Interacciones",
        hint: "Me gusta, comentarios, guardados y compartidos de los últimos 7 días.",
        current: week.interactions.current,
        previous: week.interactions.previous,
      },
      {
        label: "Seguidores ganados",
        hint: "Cuántos seguidores sumaste en los últimos 7 días.",
        current: week.followers?.change ?? null,
        previous: null,
        note: week.followersTotal === null ? undefined : `${new Intl.NumberFormat("es-UY").format(week.followersTotal)} en total`,
      },
    ],
    topPieces,
    activity: buildActivityGrid(items.map((item) => item.postedAt), now, ACTIVITY_WEEKS),
    month,
    agenda: {
      days: agendaDays,
      items: production
        .filter((item) => item.targetDate !== null && agendaDays.includes(item.targetDate))
        .map((item) => ({ id: item.id, title: item.title, status: item.status, format: item.format, targetDate: item.targetDate! })),
      today: agendaDays[0],
    },
    attention: needsAttention({
      production,
      today: agendaDays[0],
      reelsWithoutAnalysis,
      failedAnalyses: analyses.failed,
      daysSinceLast: cadence.daysSinceLast,
      brandDnaPercent: measureBrandDna(dna).percent,
      credits,
    }),
    insight: storedInsight.text ? parseInsightText(storedInsight.text) : buildInsight({
      viewsCurrent: week.views.current,
      viewsPrevious: week.views.previous,
      standout,
      daysSinceLast: cadence.daysSinceLast,
    }),
    questions: directorQuestions({
      standout,
      viewsCurrent: week.views.current,
      viewsPrevious: week.views.previous,
      daysSinceLast: cadence.daysSinceLast,
      hasStories: stories !== null,
      now,
    }),
  };
}

/**
 * Qué piezas ya tienen análisis listo y cuántos análisis fallaron y se pueden reintentar.
 * Se lee con la sesión (RLS): sólo los del propio workspace.
 */
async function getAnalysisStates(workspaceId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_analyses")
    .select("instagram_media_id, status, can_retry")
    .eq("workspace_id", workspaceId)
    .in("status", ["ready", "failed"]);
  const rows = data ?? [];
  return {
    ready: new Set(rows.filter((row) => row.status === "ready").map((row) => row.instagram_media_id as string)),
    failed: rows.filter((row) => row.status === "failed" && row.can_retry).length,
  };
}
