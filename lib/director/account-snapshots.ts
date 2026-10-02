import type { ReportModel } from "@/lib/analytics/report-model";
import type { ActionableReelAnalysis } from "@/lib/content/analysis";
import type { RankedContentItem } from "@/lib/content/library";

/**
 * Lo que el Director ve de la cuenta, en la forma más corta que alcanza: cada dato que
 * se le manda se paga en tokens. Los textos del creador (captions, análisis) van
 * marcados como contenido suyo, no como instrucciones.
 */

const MAX_CAPTION_CHARACTERS = 160;

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
  };
  return {
    id: item.id,
    enlace: pieceHref(item),
    formato: item.formatLabel,
    publicado: localDay(item.postedAt, timeZone),
    caption: item.caption ? truncate(item.caption.trim(), MAX_CAPTION_CHARACTERS) : null,
    // Un dato que Instagram no devolvió no se manda: el Director no puede confundirlo con un cero.
    metricas: Object.fromEntries(Object.entries(metrics).filter((entry): entry is [string, number] => entry[1] !== null)),
    vs_habitual: item.multiplier === null ? null : Math.round(item.multiplier * 100) / 100,
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

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
