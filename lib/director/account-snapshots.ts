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

export function pieceSnapshot(item: RankedContentItem): PieceSnapshot {
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
    publicado: localDay(item.postedAt),
    caption: item.caption ? truncate(item.caption.trim(), MAX_CAPTION_CHARACTERS) : null,
    // Un dato que Instagram no devolvió no se manda: el Director no puede confundirlo con un cero.
    metricas: Object.fromEntries(Object.entries(metrics).filter((entry): entry is [string, number] => entry[1] !== null)),
    vs_habitual: item.multiplier === null ? null : Math.round(item.multiplier * 100) / 100,
  };
}

const LABEL_FORMATTER = new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "long", timeZone: "America/Montevideo" });

/** Cómo se nombra una pieza en el chat: "Reel del 28 de setiembre". */
export function pieceLabel(item: Pick<RankedContentItem, "formatLabel" | "postedAt">) {
  return `${item.formatLabel} del ${LABEL_FORMATTER.format(new Date(item.postedAt))}`;
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
export function accountSnapshot(model: ReportModel) {
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
    mejores_piezas: model.topPieces.slice(0, 3).map(pieceSnapshot),
  };
}

const DAY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "America/Montevideo",
});

/** El día de publicación en Uruguay, para que "el Reel del 19" sea el que el creador vio ese día. */
export function localDay(isoDate: string) {
  return DAY_FORMATTER.format(new Date(isoDate));
}

/** Si una pieza cae entre dos días (inclusive), en hora de Uruguay. Sin límites, entra. */
export function isWithinDays(postedAt: string, from?: string, to?: string) {
  const day = localDay(postedAt);
  return (!from || day >= from) && (!to || day <= to);
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
