import {
  averageByWeekday,
  countPublished,
  engagementComposition,
  followerChange,
  publishedBuckets,
  ratio,
  readEngagement,
  strongestWeekday,
} from "./account-insights";
import { closedWindow, summarizePeriod, type PeriodTotal } from "./period-totals";
import {
  formatBenchmarks,
  rankAllFormats,
  topContentInPeriod,
  type ContentLibraryItem,
  type FormatBenchmark,
  type RankedContentItem,
} from "@/lib/content/library";
import type { InstagramDailyMetric } from "@/lib/data/daily-metric-series";
import type { FollowerDemographics } from "@/lib/data/follower-demographics";
import type { InstagramDashboardData } from "@/lib/data/instagram-dashboard";

/**
 * Todo lo que el informe muestra, ya calculado y sin nada de presentación.
 *
 * Vive separado de las secciones por dos motivos: las cifras se pueden verificar sin
 * renderizar nada —`npm run report:analytics` lee de acá— y mover una card de pestaña
 * no toca ni una línea de cálculo.
 */
export type ReportModel = {
  days: number;
  /** La serie completa; la usa el gráfico de seguidores, que mira niveles y no sumas. */
  series: readonly InstagramDailyMetric[];
  /** Los días ya cerrados del período: lo que miran todas las cifras y gráficos. */
  window: readonly InstagramDailyMetric[];
  views: PeriodTotal;
  saves: PeriodTotal;
  profileViews: PeriodTotal;
  linkTaps: PeriodTotal;
  /**
   * El total que informa Meta, que es el que muestra Instagram. No siempre coincide con
   * la suma de las partes: Meta cuenta acciones que no desglosa en esas cuatro.
   */
  interactions: PeriodTotal;
  engagementRate: number | null;
  saveRate: number | null;
  /** Las mismas tasas en el período anterior, para compararlas en puntos porcentuales. */
  previousEngagementRate: number | null;
  previousSaveRate: number | null;
  composition: ReturnType<typeof engagementComposition>;
  reading: ReturnType<typeof readEngagement>;
  weekdays: ReturnType<typeof averageByWeekday>;
  strongest: ReturnType<typeof strongestWeekday>;
  followers: ReturnType<typeof followerChange>;
  followersTotal: number | null;
  /** Cuentas únicas del período, tal como las calcula Meta. */
  reach: number | null;
  viewsByContent: { key: string; value: number }[] | null;
  viewsByAudience: { followers: number; nonFollowers: number } | null;
  published: number | null;
  publishedBars: { label: string; value: number }[];
  topPieces: RankedContentItem[];
  /** Cómo rinde cada formato entre lo publicado en el período. */
  formats: FormatBenchmark[];
  demographics: FollowerDemographics | null;
};

export function buildReportModel({
  dashboard,
  contentItems,
  days,
}: {
  dashboard: InstagramDashboardData;
  contentItems: ContentLibraryItem[];
  days: number;
}): ReportModel {
  const series = dashboard.dailyMetrics;
  const window = closedWindow(series, "views", days);
  const firstDay = window[0]?.date;
  const lastDay = window.at(-1)?.date;

  const views = summarizePeriod(series, "views", days);
  const likes = summarizePeriod(series, "likes", days);
  const comments = summarizePeriod(series, "comments", days);
  const saves = summarizePeriod(series, "saves", days);
  const shares = summarizePeriod(series, "shares", days);
  const interactions = summarizePeriod(series, "interactions", days);

  const composition = engagementComposition({
    likes: likes.current,
    comments: comments.current,
    saves: saves.current,
    shares: shares.current,
  });
  const weekdays = averageByWeekday(window, "interactions");
  // Los formatos se miden sobre lo publicado en el período, igual que "Qué funcionó".
  const publishedInPeriod =
    firstDay && lastDay
      ? contentItems.filter((item) => {
          const day = item.postedAt.slice(0, 10);
          return day >= firstDay && day <= lastDay;
        })
      : [];
  // Los totales que calcula Meta para la ventana elegida, no los que sumamos nosotros.
  const breakdown = dashboard.periodBreakdowns.find((item) => item.days === days) ?? null;

  return {
    days,
    series,
    window,
    views,
    saves,
    profileViews: summarizePeriod(series, "profileViews", days),
    linkTaps: summarizePeriod(series, "linkTaps", days),
    interactions,
    engagementRate: ratio(interactions.current, views.current),
    saveRate: ratio(saves.current, views.current),
    previousEngagementRate: ratio(interactions.previous, views.previous),
    previousSaveRate: ratio(saves.previous, views.previous),
    composition,
    reading: readEngagement(composition),
    weekdays,
    strongest: strongestWeekday(weekdays),
    followers: followerChange(series.slice(-days)),
    followersTotal: dashboard.followers,
    reach: breakdown?.reach ?? null,
    viewsByContent:
      breakdown?.viewsByContent?.map((item) => ({ key: item.type, value: item.value })) ?? null,
    viewsByAudience: breakdown?.viewsByAudience ?? null,
    published:
      firstDay && lastDay ? countPublished(dashboard.publishedDates, firstDay, lastDay) : null,
    publishedBars: publishedBuckets(
      dashboard.publishedDates,
      window.map((point) => point.date),
    ).map((bucket) => ({ label: bucket.label, value: bucket.count })),
    topPieces:
      firstDay && lastDay
        ? topContentInPeriod(rankAllFormats(contentItems), firstDay, lastDay)
        : [],
    formats: formatBenchmarks(publishedInPeriod),
    demographics: dashboard.followerDemographics,
  };
}
