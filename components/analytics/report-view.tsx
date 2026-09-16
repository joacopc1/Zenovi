import type { ReactNode } from "react";
import { CircleDashed, Grid3x3, SquarePlay, UserPlus, Users } from "lucide-react";
import { CommentIcon, LikeIcon, SaveIcon, ShareIcon } from "@/components/content/metric-icons";
import { calculateTrend, type TrendComparison } from "@/components/home/trend";
import type { CardTrend } from "@/components/ui/progress-metric-card";
import type { PeriodTotal } from "@/lib/analytics/period-totals";
import type { ReportModel } from "@/lib/analytics/report-model";
import type { InstagramDailyMetric } from "@/lib/data/daily-metric-series";
import { formatCompact, formatDecimal } from "@/lib/format/numbers";
import type { ChartPoint, ChartSeries } from "./daily-chart";
import type { ProportionSlice } from "./proportion-blocks";

export const pendingSync = "Se completa con la próxima sincronización";

export const HUNDRED_FOLLOWERS =
  "Meta sólo entrega este dato a cuentas con 100 seguidores o más, y todavía no se sincroniza.";

/** Orden y colores fijos: el color sigue a la categoría, no a su tamaño. */
export const engagementSeries: ChartSeries[] = [
  { key: "likes", label: "Me gusta", color: "var(--color-series-1)" },
  { key: "comments", label: "Comentarios", color: "var(--color-series-2)" },
  { key: "saves", label: "Guardados", color: "var(--color-series-3)" },
  { key: "shares", label: "Compartidos", color: "var(--color-series-4)" },
];

/** Los mismos íconos que muestra cada Reel en la biblioteca. */
const engagementIcons: Record<string, ReactNode> = {
  likes: <LikeIcon className="size-3.5" />,
  comments: <CommentIcon className="size-3.5" />,
  saves: <SaveIcon className="size-3.5" />,
  shares: <ShareIcon className="size-3.5" />,
};

/** Los mismos signos que usa Instagram: el play de Reels, la grilla del perfil, el aro de Historias. */
const contentParts: Record<string, { label: string; color: string; icon: ReactNode }> = {
  reels: { label: "Reels", color: "var(--color-series-1)", icon: <SquarePlay size={14} strokeWidth={1.75} /> },
  posts: { label: "Publicaciones", color: "var(--color-series-2)", icon: <Grid3x3 size={14} strokeWidth={1.75} /> },
  stories: { label: "Historias", color: "var(--color-series-3)", icon: <CircleDashed size={14} strokeWidth={1.75} /> },
  other: { label: "Otros", color: "var(--color-series-4)", icon: <CircleDashed size={14} strokeWidth={1.75} /> },
};

const audienceParts: Record<string, { label: string; color: string; icon: ReactNode }> = {
  followers: { label: "Seguidores", color: "var(--color-series-1)", icon: <Users size={14} strokeWidth={1.75} /> },
  nonFollowers: { label: "No seguidores", color: "var(--color-series-2)", icon: <UserPlus size={14} strokeWidth={1.75} /> },
};

/** Un reparto listo para dibujar, o `null` cuando no hay nada que repartir. */
function toSlices(
  parts: readonly { key: string; value: number }[],
  catalog: Record<string, { label: string; color: string; icon: ReactNode }>,
): ProportionSlice[] | null {
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  if (total === 0) return null;

  return parts.flatMap((part) => {
    const meta = catalog[part.key];
    return meta === undefined
      ? []
      : [{ key: part.key, label: meta.label, color: meta.color, value: part.value, share: part.value / total, icon: meta.icon }];
  });
}

export function contentSlices(parts: ReportModel["viewsByContent"]) {
  return parts === null ? null : toSlices(parts, contentParts);
}

export function audienceSlices(audience: ReportModel["viewsByAudience"]) {
  return audience === null
    ? null
    : toSlices(
        [
          { key: "followers", value: audience.followers },
          { key: "nonFollowers", value: audience.nonFollowers },
        ],
        audienceParts,
      );
}

export function engagementSlices(composition: ReportModel["composition"]): ProportionSlice[] | null {
  if (composition === null) return null;
  const byKey = new Map(engagementSeries.map((item) => [item.key, item]));

  return composition.flatMap((slice) => {
    const meta = byKey.get(slice.part);
    return meta === undefined
      ? []
      : [{
          key: slice.part,
          label: meta.label,
          color: meta.color,
          value: slice.value,
          share: slice.share,
          icon: engagementIcons[slice.part],
        }];
  });
}

/**
 * La variación contra el período anterior, sólo cuando se puede afirmar: el período
 * tiene que estar completo y el anterior tener volumen con el que comparar.
 */
export function trendOf(total: PeriodTotal | null): TrendComparison | null {
  if (total === null || total.current === null || total.reportedDays !== total.days) return null;
  if (total.previous === null || total.previous <= 0) return null;

  return calculateTrend(total.current, total.previous, true);
}

/** Los datos que espera la Progress Metric Card para una métrica del período. */
export function metricCard(
  model: ReportModel,
  title: string,
  read: (point: InstagramDailyMetric) => number | null,
  total: PeriodTotal | null,
  totalValue?: number | null,
) {
  const data = model.window.flatMap((point) => {
    const value = read(point);
    return value === null ? [] : [{ value, date: point.label }];
  });
  const trend = trendOf(total);

  return {
    title,
    data,
    total: formatCompact(total ? total.current : (totalValue ?? null)),
    period: `Últimos ${model.days} días`,
    percent:
      trend && trend.direction !== "unavailable"
        ? `${formatDecimal(Math.abs(trend.percentage ?? 0))}%`
        : null,
    trend: (trend?.direction === "up" || trend?.direction === "down"
      ? trend.direction
      : "flat") as CardTrend,
  };
}

export function toPoints(
  points: readonly InstagramDailyMetric[],
  keys: readonly (keyof InstagramDailyMetric)[],
): ChartPoint[] {
  return points.map((point) => ({
    date: point.date,
    label: point.label,
    values: Object.fromEntries(keys.map((key) => [key, point[key] as number | null])),
  }));
}

export function signed(value: number, format: (value: number) => string) {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${format(Math.abs(value))}`;
}

/** El ícono del formato tal como lo nombra la biblioteca: reel, publicación o historia. */
export function contentIcon(kind: "reel" | "publication" | "story") {
  const byKind = { reel: "reels", publication: "posts", story: "stories" } as const;
  return contentParts[byKind[kind]].icon;
}
