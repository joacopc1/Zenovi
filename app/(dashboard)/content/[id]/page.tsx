import Link from "next/link";
import { notFound } from "next/navigation";
import { AnalysisSection } from "@/components/content/analysis-section";
import { ClipDuration } from "@/components/content/clip-duration";
import { ContentThumbnail } from "@/components/content/content-thumbnail";
import { PerformanceBadge } from "@/components/content/performance-badge";
import { PerformanceStanding } from "@/components/content/performance-standing";
import { AppHeader } from "@/components/shell/app-header";
import type { AnalysisState } from "@/lib/content/analysis";
import { EXAMPLE_ANALYSIS } from "@/lib/content/analysis-example";
import { buildCohort, viewsRank } from "@/lib/content/library";
import { getAccountContext } from "@/lib/data/account-context";
import { getInstagramContentLibrary } from "@/lib/data/instagram-content";

const formatPlurals = {
  reel: "Reels",
  publication: "publicaciones",
  story: "Historias",
} as const;

const numberFormatter = new Intl.NumberFormat("es-UY");
const decimalFormatter = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 });

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
  const library = account?.workspace
    ? await getInstagramContentLibrary(account.workspace.id)
    : null;
  if (!library) notFound();

  // La pieza se lee dentro de su cohorte, que es lo que le da escala a cada número:
  // se resuelve el formato primero y recién después se busca la pieza ya medida.
  const kind = library.items.find((candidate) => candidate.id === id)?.kind;

  if (!kind) notFound();

  const cohort = buildCohort(library.items, kind);
  const item = cohort.find((candidate) => candidate.id === id);

  if (!item) notFound();

  const rank = viewsRank(cohort, id);

  // Cuánta gente lo vio, frente a qué hizo esa gente: son dos preguntas distintas.
  const distribution = [
    { label: "Visualizaciones", value: formatMetric(item.views) },
    { label: "Alcance", value: formatMetric(item.reach) },
  ];
  const reactions = [
    { label: "Interacciones", value: formatMetric(item.interactions) },
    { label: "Me gusta", value: formatMetric(item.likes) },
    { label: "Comentarios", value: formatMetric(item.comments) },
    { label: "Guardados", value: formatMetric(item.saves) },
    { label: "Compartidos", value: formatMetric(item.shares) },
  ];

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-[1120px] px-5 py-6 md:px-8 md:py-8 lg:px-10">
        <Link href={item.kind === "reel" ? "/content" : `/content?type=${item.kind}`} className="inline-flex min-h-8 items-center text-sm text-graphite hover:text-ink">
          <span aria-hidden="true">←</span>&nbsp; Volver a Contenido
        </Link>

        <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[13px] font-medium text-muted">{item.formatLabel} · {item.dateLabel}</p>
            <h1 className="mt-1 line-clamp-2 max-w-3xl text-xl font-semibold tracking-[-0.02em]">
              {item.caption?.trim() || `${item.formatLabel} sin texto`}
            </h1>
            <PerformanceStanding
              item={item}
              rank={rank}
              formatPlural={formatPlurals[item.kind]}
            />
          </div>
          {item.permalink ? (
            <a
              href={item.permalink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 items-center rounded-control border border-mist bg-paper px-3.5 text-sm font-medium text-ink hover:bg-ink/[0.035]"
            >
              Ver en Instagram ↗
            </a>
          ) : null}
        </header>

        <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="relative self-start overflow-hidden rounded-card border border-mist bg-paper" aria-label="Vista previa del contenido">
            <ContentThumbnail item={item} priority />
            <PerformanceBadge multiplier={item.multiplier} className="absolute left-3 top-3" />
          </section>

          <div className="space-y-5">
            <section className="overflow-hidden rounded-card border border-mist bg-paper">
              <header className="border-b border-mist px-5 py-4">
                <h2 className="text-base font-semibold">Rendimiento oficial</h2>
                <p className="mt-1 text-[13px] text-muted">Métricas disponibles desde Instagram</p>
              </header>
              <MetricGroup title="Cuánta gente lo vio" metrics={distribution} />
              <MetricGroup title="Qué hizo esa gente" metrics={reactions} />
            </section>

            {item.kind === "reel" ? (
              <section className="rounded-card border border-mist bg-paper px-5 py-4">
                <h2 className="text-base font-semibold">Reproducción</h2>
                <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <dt className="text-[13px] text-muted">Duración</dt>
                    <dd className="mt-1 text-base font-semibold">
                      <ClipDuration mediaUrl={item.mediaUrl} />
                    </dd>
                  </div>
                  <DetailMetric label="Tiempo medio" value={formatDuration(item.averageWatchTimeMs)} />
                  <DetailMetric label="Tiempo total" value={formatDuration(item.totalWatchTimeMs)} />
                  <DetailMetric label="Omisión inicial" value={formatRate(item.skipRate)} />
                </dl>
              </section>
            ) : null}

            <AnalysisSection state={analysisState} />
          </div>
        </div>
      </main>
    </>
  );
}

function MetricGroup({
  title,
  metrics,
}: {
  title: string;
  metrics: { label: string; value: string }[];
}) {
  return (
    <div className="border-t border-mist px-5 py-4 first-of-type:border-t-0">
      <h3 className="text-[13px] font-medium text-ink">{title}</h3>
      <dl className="mt-3 grid gap-x-5 gap-y-3 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-baseline justify-between gap-3">
            <dt className="text-[13px] text-graphite">{metric.label}</dt>
            <dd className="text-base font-semibold tabular-nums">{metric.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="mt-1 text-base font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function formatMetric(value: number | null) {
  return value === null ? "No disponible" : numberFormatter.format(Math.round(value));
}

function formatDuration(value: number | null) {
  if (value === null) return "No disponible";
  const seconds = value / 1000;
  return seconds >= 60
    ? `${decimalFormatter.format(seconds / 60)} min`
    : `${decimalFormatter.format(seconds)} s`;
}

function formatRate(value: number | null) {
  if (value === null) return "No disponible";
  return `${decimalFormatter.format(value <= 1 ? value * 100 : value)} %`;
}
