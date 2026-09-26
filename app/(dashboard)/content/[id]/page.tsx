import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  BadgeDollarSign,
  Clock3,
  Eye,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { AnalysisSection } from "@/components/content/analysis-section";
import { BenchmarkSection } from "@/components/content/benchmark-section";
import { ClipDuration } from "@/components/content/clip-duration";
import { ContentThumbnail } from "@/components/content/content-thumbnail";
import { EngagementBreakdown } from "@/components/content/engagement-breakdown";
import { PerformanceBadge } from "@/components/content/performance-badge";
import { PerformanceStanding } from "@/components/content/performance-standing";
import { PlaybackInsights } from "@/components/content/playback-insights";
import { ReelPlayer } from "@/components/content/reel-player";
import { ReelViewsEvolution } from "@/components/content/reel-views-evolution";
import { ContentCaption } from "@/components/content/content-caption";
import { AppHeader } from "@/components/shell/app-header";
import type { AnalysisState } from "@/lib/content/analysis";
import { EXAMPLE_ANALYSIS } from "@/lib/content/analysis-example";
import { buildCohort, viewsRank, CONTENT_KIND_PLURALS } from "@/lib/content/library";
import { getEngagementRate } from "@/lib/content/metrics";
import { getAccountContext } from "@/lib/data/account-context";
import { getInstagramContentLibrary } from "@/lib/data/instagram-content";
import { getFreshInstagramMediaSource } from "@/lib/data/instagram-media-source";
import { getMediaViewEvolution } from "@/lib/data/media-view-evolution";

const numberFormatter = new Intl.NumberFormat("es-UY");
const decimalFormatter = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 });
const publishedDateFormatter = new Intl.DateTimeFormat("es-UY", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Montevideo",
});

export default async function ContentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ejemplo?: string | string[] }>;
}) {
  const account = await getAccountContext();
  const { id } = await params;
  const { ejemplo } = await searchParams;
  // Mientras el pipeline no existe, `?ejemplo=1` permite mirar la pantalla con un
  // análisis de muestra. Sólo en desarrollo: en producción no hay forma de verlo.
  const analysisState: AnalysisState =
    process.env.NODE_ENV !== "production" && ejemplo === "1"
      ? { status: "ready", analysis: EXAMPLE_ANALYSIS }
      : { status: "not_requested" };
  const workspaceId = account?.workspace?.id;
  if (!workspaceId) notFound();

  const library = await getInstagramContentLibrary(workspaceId);
  if (!library) notFound();

  // La pieza se lee dentro de su cohorte, que es lo que le da escala a cada número:
  // se resuelve el formato primero y recién después se busca la pieza ya medida.
  const kind = library.items.find((candidate) => candidate.id === id)?.kind;

  if (!kind) notFound();

  const cohort = buildCohort(library.items, kind);
  const item = cohort.find((candidate) => candidate.id === id);

  if (!item) notFound();

  const rank = viewsRank(cohort, id);
  const [freshMediaSource, viewEvolution] =
    item.kind === "reel"
      ? await Promise.all([
          getFreshInstagramMediaSource(workspaceId, item.id),
          getMediaViewEvolution(item.id),
        ])
      : [null, []];
  const playbackUrl = freshMediaSource?.mediaUrl ?? item.mediaUrl;
  const posterUrl = freshMediaSource?.thumbnailUrl ?? item.thumbnailUrl;

  const metrics = [
    { label: "Visualizaciones", value: item.views, icon: Eye, note: null, format: "number" as const },
    { label: "Alcance", value: item.reach, icon: UsersRound, note: "Cuentas únicas", format: "number" as const },
    {
      label: "Engagement",
      value: getEngagementRate(item.interactions, item.views),
      icon: Activity,
      note: item.interactions === null ? null : `${formatMetric(item.interactions)} interacciones`,
      format: "percentage" as const,
    },
    {
      label: "Ventas",
      value: null,
      icon: BadgeDollarSign,
      note: "Próximamente",
      format: "comingSoon" as const,
    },
  ];

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-[1160px] px-5 py-6 md:px-8 md:py-8 lg:px-10">
        <Link
          href={item.kind === "reel" ? "/content" : `/content?type=${item.kind}`}
          className="font-support inline-flex min-h-8 items-center gap-2 text-[13px] text-graphite hover:text-ink"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" strokeWidth={1.7} />
          Volver a {CONTENT_KIND_PLURALS[item.kind]}
        </Link>

        <div className="mt-5 grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)] lg:gap-8">
          <section className="w-full max-w-[270px] overflow-hidden rounded-card border border-mist bg-paper" aria-label="Vista previa del contenido">
            <div className="relative">
              {item.kind === "reel" ? (
                <ReelPlayer mediaUrl={playbackUrl} posterUrl={posterUrl} />
              ) : (
                <ContentThumbnail item={item} priority />
              )}
              <PerformanceBadge
                multiplier={item.multiplier}
                showUnavailable
                overlay
                className="absolute left-3 top-3"
              />
              {item.kind === "reel" ? (
                <div className="font-support absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                  <Clock3 aria-hidden="true" className="size-3.5" strokeWidth={1.7} />
                  <ClipDuration mediaUrl={playbackUrl} />
                </div>
              ) : null}
            </div>
            {item.permalink ? (
              <div className="border-t border-mist p-3">
                <a
                  href={item.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="font-support flex min-h-8 w-full items-center justify-center gap-1.5 rounded-control border border-mist bg-paper px-3 text-[12px] font-medium text-ink transition-colors hover:border-mist-strong hover:bg-canvas"
                >
                  Ver en Instagram
                  <ArrowUpRight aria-hidden="true" className="size-3.5" strokeWidth={1.7} />
                </a>
              </div>
            ) : null}
          </section>

          <div className="min-w-0 space-y-5">
            <div className="border-b border-mist pb-5">
              <ContentCaption
                caption={item.caption}
                publishedLabel={publishedDateFormatter.format(new Date(item.postedAt))}
                formatLabel={item.formatLabel}
              />
              {item.multiplier !== null ? (
                <PerformanceStanding item={item} rank={rank} formatPlural={CONTENT_KIND_PLURALS[item.kind]} />
              ) : null}
            </div>

            <section aria-label="Rendimiento de la pieza">
              <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                  <MetricCell key={metric.label} {...metric} />
                ))}
              </dl>
            </section>

            {item.kind === "reel" ? (
              <div className="grid gap-3 xl:grid-cols-2">
                <EngagementBreakdown item={item} />
                <PlaybackInsights
                  averageWatchTimeMs={item.averageWatchTimeMs}
                  totalWatchTimeMs={item.totalWatchTimeMs}
                  skipRate={item.skipRate}
                  mediaUrl={playbackUrl}
                />
              </div>
            ) : (
              <EngagementBreakdown item={item} />
            )}
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {item.kind === "reel" ? <ReelViewsEvolution points={viewEvolution} /> : null}
          <BenchmarkSection cohort={cohort} item={item} />
          <AnalysisSection state={analysisState} />
        </div>
      </main>
    </>
  );
}

function MetricCell({
  label,
  value,
  note,
  format,
  icon: Icon,
}: {
  label: string;
  value: number | null;
  note: string | null;
  format: "number" | "percentage" | "comingSoon";
  icon: LucideIcon;
}) {
  const displayValue =
    format === "comingSoon"
      ? "—"
      : format === "percentage"
        ? formatRate(value)
        : formatMetric(value);
  const displayNote =
    format === "comingSoon"
      ? note
      : value === null
        ? "Instagram no devolvió este dato"
        : note;

  return (
    <div className="min-w-0 rounded-card border border-mist bg-paper px-4 py-4">
      <dt className="font-support flex items-center gap-2 text-[13px] font-medium text-ink">
        <Icon aria-hidden="true" className="size-4 text-ink" strokeWidth={1.7} />
        {label}
      </dt>
      <dd className="font-numeric mt-2 text-[22px] font-semibold leading-none tracking-[-0.02em] tabular-nums">
        {displayValue}
      </dd>
      <dd className="font-support mt-1.5 min-h-4 text-[12px] text-graphite">
        {displayNote}
      </dd>
    </div>
  );
}

function formatMetric(value: number | null) {
  return value === null ? "No disponible" : numberFormatter.format(Math.round(value));
}

function formatRate(value: number | null) {
  if (value === null) return "No disponible";
  return `${decimalFormatter.format(value <= 1 ? value * 100 : value)} %`;
}
