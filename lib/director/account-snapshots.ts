import type { ReportModel } from "@/lib/analytics/report-model";
import type { ActionableReelAnalysis } from "@/lib/content/analysis";
import type { RankedContentItem } from "@/lib/content/library";
import type { ReelScript } from "@/lib/content/script";
import type { StorySequenceAnalysis } from "@/lib/content/story-analysis";
import {
  compareWithOwnSequences,
  lossPerStory,
  storyRetention,
  type SequenceKpiKey,
  type StorySequence,
} from "../content/story-sequences.ts";

/**
 * Lo que el Director ve de la cuenta, en la forma más corta que alcanza: cada dato que
 * se le manda se paga en tokens. Los textos del creador (captions, análisis) van
 * marcados como contenido suyo, no como instrucciones.
 */

const MAX_CAPTION_CHARACTERS = 160;
/** Un Reel de un minuto dice unas 150 palabras: alcanza para leerlo entero sin pagar uno de diez. */
const MAX_SCRIPT_CHARACTERS = 2400;

export type PieceSnapshot = {
  id: string;
  /** El enlace con el que el Director cita la pieza; la pantalla lo convierte en un chip. */
  enlace: string;
  formato: string;
  publicado: string;
  caption: string | null;
  metricas: Record<string, number>;
  /** Cuántas veces lo habitual en su formato rindió en views (1,8 = 80 % más). Null sin cohorte. */
  vs_habitual: number | null;
};

/** Si el navegador no informa una zona válida, se usa la de Uruguay, donde están los primeros usuarios. */
export const DEFAULT_TIME_ZONE = "America/Montevideo";

/** La zona horaria que manda el navegador, sólo si existe: un valor inventado no llega a Intl. */
export function validTimeZone(value: unknown) {
  if (typeof value !== "string" || value.length > 64) return DEFAULT_TIME_ZONE;
  try {
    new Intl.DateTimeFormat("es", { timeZone: value });
    return value;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

export function pieceSnapshot(item: RankedContentItem, timeZone = DEFAULT_TIME_ZONE): PieceSnapshot {
  const metrics: Record<string, number | null> = {
    views: item.views,
    alcance: item.reach,
    interacciones: item.interactions,
    me_gusta: item.likes,
    comentarios: item.comments,
    guardados: item.saves,
    compartidos: item.shares,
    seguidores_ganados: item.follows,
    visitas_al_perfil: item.profileVisits,
    respuestas: item.replies,
    duracion_segundos: seconds(item.durationMs),
    segundos_vistos_en_promedio: seconds(item.averageWatchTimeMs),
    porcentaje_que_lo_salteo: item.skipRate === null ? null : percent(item.skipRate <= 1 ? item.skipRate : item.skipRate / 100),
    toques_para_adelantar: item.storyForwardTaps,
    toques_para_volver: item.storyBackTaps,
    salidas: item.storyExits,
    deslizaron_a_otra_cuenta: item.storyNextSwipes,
  };
  return {
    id: item.id,
    enlace: pieceHref(item),
    formato: item.formatLabel,
    publicado: localDay(item.postedAt, timeZone),
    caption: item.caption ? truncate(item.caption.trim(), MAX_CAPTION_CHARACTERS) : null,
    // Un dato que Instagram no devolvió no se manda: el Director no puede confundirlo con un cero.
    metricas: Object.fromEntries(Object.entries(metrics).filter((entry): entry is [string, number] => typeof entry[1] === "number")),
    vs_habitual: item.multiplier === null ? null : Math.round(item.multiplier * 100) / 100,
  };
}

/**
 * Lo que se dice en el Reel, partido como lo ve el creador: gancho, desarrollo y cierre.
 * Sale de la transcripción guardada; las palabras son del creador, no instrucciones.
 */
export function scriptSnapshot(script: Pick<ReelScript, "segments" | "transcript">) {
  const said = (fromMs: number, toMs: number) =>
    script.transcript.filter((moment) => moment.atMs >= fromMs && moment.atMs < toMs).map((moment) => moment.quote.trim()).join(" ");
  const parts = { gancho: [] as string[], desarrollo: [] as string[], cierre: [] as string[] };
  for (const segment of script.segments) {
    const text = said(segment.fromMs, segment.toMs);
    if (!text) continue;
    parts[segment.role === "hook" ? "gancho" : segment.role === "cta" ? "cierre" : "desarrollo"].push(text);
  }
  let budget = MAX_SCRIPT_CHARACTERS;
  const fit = (texts: string[]) => {
    if (texts.length === 0 || budget <= 0) return null;
    const text = truncate(texts.join(" "), budget);
    budget -= text.length;
    return text;
  };
  // El gancho y el cierre son lo que más se discute: se recortan últimos, el desarrollo primero.
  const gancho = fit(parts.gancho);
  const cierre = fit(parts.cierre);
  return { gancho, desarrollo: fit(parts.desarrollo), cierre };
}

/**
 * Una secuencia de Historias (las de un mismo día) con las mismas cuentas que la sección:
 * cuántos llegaron al final, cuántos se pierden por Historia y la curva entera, cada KPI
 * contra lo habitual de la cuenta. Las proporciones van en porcentaje.
 */
export function sequenceSnapshot(
  sequence: StorySequence,
  sequences: readonly StorySequence[],
  timeZone = DEFAULT_TIME_ZONE,
  analysis: StorySequenceAnalysis | null = null,
) {
  const habitual = (key: SequenceKpiKey) => {
    const comparison = compareWithOwnSequences(sequences, sequence.id, key);
    if (!comparison) return null;
    const asPercent = key === "completion" || key === "lossPerStory";
    return asPercent ? percent(comparison.median) : Math.round(comparison.median * 10) / 10;
  };
  const per100 = (total: number | null) => {
    const started = sequence.stories[0].reach;
    return total === null || !started ? null : Math.round((total / started) * 1000) / 10;
  };
  return {
    id: sequence.id,
    enlace: pieceHref(sequence.stories[0]),
    dia: localDay(sequence.startedAt, timeZone),
    historias: sequence.stories.length,
    empezaron: sequence.stories[0].reach,
    completaron_pct: sequence.completionRate === null ? null : percent(sequence.completionRate),
    completaron_habitual_pct: habitual("completion"),
    perdida_por_historia_pct: nullablePercent(lossPerStory(sequence)),
    perdida_por_historia_habitual_pct: habitual("lossPerStory"),
    // Cada 100 personas que empezaron, para comparar días con audiencias distintas.
    respuestas_cada_100: per100(sequence.totalReplies),
    respuestas_cada_100_habitual: habitual("replies"),
    visitas_al_perfil_cada_100: per100(sequence.totalProfileVisits),
    visitas_al_perfil_cada_100_habitual: habitual("profileVisits"),
    seguidores_ganados: sequence.totalFollows,
    retencion_por_historia_pct: storyRetention(sequence).map(nullablePercent),
    textos: sequence.stories.map((story) => (story.caption ? truncate(story.caption.trim(), MAX_CAPTION_CHARACTERS) : null)),
    analisis: analysis
      ? {
          diagnostico: analysis.diagnosis.verdict,
          explicacion: analysis.diagnosis.explanation,
          hallazgos: analysis.findings.slice(0, 4).map((finding) => finding.title),
          acciones: analysis.actions.slice(0, 4).map((action) => action.title),
        }
      : null,
  };
}

/** Cómo se nombra una pieza en el chat: "Reel del 28 de setiembre", según el día del creador. */
export function pieceLabel(item: Pick<RankedContentItem, "formatLabel" | "postedAt">, timeZone = DEFAULT_TIME_ZONE) {
  const day = new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "long", timeZone }).format(new Date(item.postedAt));
  return `${item.formatLabel} del ${day}`;
}

export function pieceHref(item: Pick<RankedContentItem, "id" | "kind">) {
  return item.kind === "reel" ? `/content/${item.id}` : `/content/${item.id}?type=${item.kind}`;
}

/** Del análisis guardado, sólo lo que sirve para conversar: el diagnóstico y el plan, sin la evidencia. */
export function analysisSnapshot(analysis: ActionableReelAnalysis) {
  return {
    diagnostico: analysis.performance.verdict,
    explicacion: analysis.performance.explanation,
    hallazgos: analysis.findings.slice(0, 4).map((finding) => finding.title),
    conservar: analysis.actionPlan.keep.slice(0, 3).map((action) => action.title),
    cambiar: analysis.actionPlan.change.slice(0, 3).map((action) => action.title),
    probar: analysis.actionPlan.test.slice(0, 3).map((action) => action.title),
  };
}

/** El resumen de un período con las mismas cuentas que Analíticas: lo que el creador ve es lo que el Director lee. */
export function accountSnapshot(model: ReportModel, timeZone = DEFAULT_TIME_ZONE) {
  const total = (period: { current: number | null; previous: number | null }) => ({
    actual: period.current,
    anterior: period.previous,
  });
  return {
    dias: model.days,
    views: total(model.views),
    interacciones: total(model.interactions),
    guardados: total(model.saves),
    visitas_al_perfil: total(model.profileViews),
    toques_en_el_enlace: total(model.linkTaps),
    alcance: model.reach,
    tasa_de_interaccion: model.engagementRate,
    seguidores: model.followersTotal,
    cambio_de_seguidores: model.followers?.change ?? null,
    publicaciones: model.published,
    mejor_dia: model.strongest?.weekday ?? null,
    mejores_piezas: model.topPieces.slice(0, 3).map((item) => pieceSnapshot(item, timeZone)),
  };
}

/** El día de publicación en la zona del creador, para que "el Reel del 19" sea el que vio ese día. */
export function localDay(isoDate: string, timeZone = DEFAULT_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone }).format(new Date(isoDate));
}

/** Si una pieza cae entre dos días (inclusive), en la zona del creador. Sin límites, entra. */
export function isWithinDays(postedAt: string, from?: string, to?: string, timeZone = DEFAULT_TIME_ZONE) {
  const day = localDay(postedAt, timeZone);
  return (!from || day >= from) && (!to || day <= to);
}

function seconds(ms: number | null) {
  return ms === null ? null : Math.round(ms / 100) / 10;
}

function percent(share: number) {
  return Math.round(share * 1000) / 10;
}

function nullablePercent(share: number | null) {
  return share === null ? null : percent(share);
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * El mensaje con el que se abre el Director desde una tarjeta de Producción: queda en la
 * caja para que el creador lo ajuste antes de mandarlo.
 */
export function ideaPrompt(idea: { title: string; hook: string; development: string; cta: string }) {
  const parts = [`Quiero desarrollar esta idea de mi Producción: «${idea.title.trim() || "sin título"}».`];
  if (idea.hook.trim()) parts.push(`Gancho: ${idea.hook.trim()}`);
  if (idea.development.trim()) parts.push(`Lo que tengo hasta ahora: ${truncate(idea.development.trim(), 600)}`);
  if (idea.cta.trim()) parts.push(`Cierre: ${idea.cta.trim()}`);
  parts.push("¿Cómo la mejorarías?");
  return parts.join("\n");
}
