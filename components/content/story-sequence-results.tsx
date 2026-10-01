import type { LucideIcon } from "lucide-react";
import { CircleUserRound, MessageCircle, TrendingDown, UserPlus, UsersRound } from "lucide-react";
import { AnimatedNumber } from "@/components/analytics/animated-number";
import { HelpHint } from "@/components/ui/help-hint";
import { formatCompact, formatDecimal, formatPercent } from "@/lib/format/numbers";
import type { RankedContentItem } from "@/lib/content/library";
import {
  compareWithOwnSequences,
  lossPerStory,
  storyRetention,
  sequenceKpiRate,
  sequenceKpiTotal,
  type SequenceComparison,
  type SequenceKpiKey,
  type StorySequence,
} from "@/lib/content/story-sequences";
import { MIN_BENCHMARK_SAMPLE } from "@/lib/content/metrics";
import { ContentThumbnail } from "./content-thumbnail";

type CountKpi = {
  key: Exclude<SequenceKpiKey, "completion" | "lossPerStory">;
  label: string;
  icon: LucideIcon;
};

/** Lo que le importa a quien vende con Historias: si llegaron al final y si eso abrió conversaciones. */
const countKpis: CountKpi[] = [
  { key: "replies", label: "Respuestas", icon: MessageCircle },
  { key: "profileVisits", label: "Visitas al perfil", icon: CircleUserRound },
  { key: "follows", label: "Seguidores ganados", icon: UserPlus },
];

/** El mismo tooltip que usan las gráficas del resto de la app, visible al instante. */
const TOOLTIP =
  "font-support pointer-events-none absolute z-10 whitespace-nowrap rounded-lg bg-paper/90 px-2.5 py-1.5 text-[11px] text-ink ring ring-ink/10 backdrop-blur-lg opacity-0 transition-opacity duration-75 group-hover:opacity-100";

const COMPLETION_HELP =
  "De las personas que vieron la primera Historia, cuántas llegaron a la última.";

export function StorySequenceResults({
  sequence,
  sequences,
}: {
  sequence: StorySequence;
  sequences: readonly StorySequence[];
}) {
  return (
    <>
      <div className="grid gap-3 lg:grid-cols-2">
        <dl className="contents">
          <CompletionCard
            sequence={sequence}
            comparison={compareWithOwnSequences(sequences, sequence.id, "completion")}
          />
        </dl>
        <RetentionCard
          sequence={sequence}
          comparison={compareWithOwnSequences(sequences, sequence.id, "lossPerStory")}
        />
      </div>
      <dl className="grid gap-3 sm:grid-cols-3">
        {countKpis.map((kpi) => (
          <CountCard
            key={kpi.key}
            kpi={kpi}
            sequence={sequence}
            comparison={compareWithOwnSequences(sequences, sequence.id, kpi.key)}
          />
        ))}
      </dl>
      <PerStoryTable stories={sequence.stories} />
    </>
  );
}

/** Lo que completó, con la tendencia de tus últimas secuencias: ahí ver la evolución dice algo. */
function CompletionCard({
  sequence,
  comparison,
}: {
  sequence: StorySequence;
  comparison: SequenceComparison | null;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col rounded-card border border-mist bg-paper px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <dt className="font-support flex items-center gap-2 text-[13px] font-medium text-ink">
          <UsersRound aria-hidden="true" className="size-4" strokeWidth={1.7} />
          Completaron la secuencia
          <HelpHint text={COMPLETION_HELP} />
        </dt>
        <dd className="font-support text-[12px] text-graphite">
          {comparison ? (
            <Difference value={Math.round((comparison.current / comparison.median - 1) * 100)} />
          ) : (
            <span className="text-muted">Se compara cuando tengas {MIN_BENCHMARK_SAMPLE} secuencias</span>
          )}
        </dd>
      </div>
      <dd className="font-numeric mt-2 text-[22px] font-semibold leading-none tracking-[-0.02em] tabular-nums">
        <AnimatedNumber value={sequence.completionRate} format="percent" />
      </dd>
      <dd className="font-support mt-1.5 text-[12px] text-graphite">{sequence.stories.length} Historias</dd>
      {comparison ? <RecentBars comparison={comparison} /> : null}
    </div>
  );
}

/** Qué parte de los que empezaron sigue en cada Historia: muestra en cuál se fue la gente. */
function RetentionCard({
  sequence,
  comparison,
}: {
  sequence: StorySequence;
  comparison: SequenceComparison | null;
}) {
  const loss = lossPerStory(sequence);
  const retention = storyRetention(sequence);
  const last = sequence.stories.length - 1;
  const x = (index: number) => (last === 0 ? 50 : (index / last) * 100);
  const measured = retention.flatMap((value, index) => (value === null ? [] : [{ index, value }]));
  const line = measured.map(({ index, value }) => `${x(index)},${100 - value * 100}`).join(" ");
  const showLabels = sequence.stories.length <= 6;

  return (
    <section className="flex h-full min-w-0 flex-col rounded-card border border-mist bg-paper px-4 py-4" aria-labelledby="retention-title">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <h3 id="retention-title" className="font-support flex items-center gap-2 text-[13px] font-medium text-ink">
          <TrendingDown aria-hidden="true" className="size-4" strokeWidth={1.7} />
          Curva de abandono
        </h3>
        {loss !== null ? (
          <p className="font-support text-[12px] text-graphite">
            Perdés <strong className="font-semibold text-ink">{formatPercent(loss)}</strong> por Historia
            {comparison ? <span className="text-muted"> · lo habitual es {formatPercent(comparison.median)}</span> : null}
          </p>
        ) : null}
      </div>

      <div className="mt-auto pt-7">
        <div className="relative mx-4 h-28">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 border-t border-mist" />
          <div aria-hidden="true" className="absolute inset-x-0 top-1/2 border-t border-mist" />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 border-t border-mist" />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
            {measured.length > 1 ? (
              <>
                <polygon
                  points={`${x(measured[0].index)},100 ${line} ${x(measured.at(-1)!.index)},100`}
                  className="fill-data/10"
                />
                <polyline points={line} fill="none" vectorEffect="non-scaling-stroke" strokeWidth={2} strokeLinejoin="round" className="stroke-data" />
              </>
            ) : null}
          </svg>
          {measured.map(({ index, value }) => (
            <div
              key={sequence.stories[index].id}
              className="group absolute grid size-6 -translate-x-1/2 translate-y-1/2 place-items-center"
              style={{ left: `${x(index)}%`, bottom: `${value * 100}%` }}
            >
              <span className="size-2.5 rounded-full border-2 border-data bg-paper transition-transform group-hover:scale-125" />
              {showLabels ? (
                <span className="font-numeric pointer-events-none absolute bottom-full text-[11px] font-semibold text-ink group-hover:opacity-0">
                  {formatPercent(value)}
                </span>
              ) : null}
              <span className={`${TOOLTIP} bottom-full mb-1`}>
                Historia {index + 1} · {formatPercent(value)} · {formatCompact(sequence.stories[index].reach)} personas
              </span>
            </div>
          ))}
        </div>
        <div className="font-support relative mx-4 mt-2 h-4 text-[11px] text-muted">
          {sequence.stories.map((story, index) => (
            <span key={story.id} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${x(index)}%` }}>
              {index + 1}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function CountCard({
  kpi,
  sequence,
  comparison,
}: {
  kpi: CountKpi;
  sequence: StorySequence;
  comparison: SequenceComparison | null;
}) {
  const Icon = kpi.icon;
  const rate = sequenceKpiRate(sequence, kpi.key);

  return (
    <div className="min-w-0 rounded-card border border-mist bg-paper px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <dt className="font-support flex items-center gap-2 text-[13px] font-medium text-ink">
          <Icon aria-hidden="true" className="size-4" strokeWidth={1.7} />
          {kpi.label}
        </dt>
        <dd className="font-support text-[12px] text-graphite">
          {!comparison ? (
            <span className="text-muted">Se compara cuando tengas {MIN_BENCHMARK_SAMPLE} secuencias</span>
          ) : comparison.median === 0 ? (
            "Tus secuencias no suelen sumar esto"
          ) : (
            <Difference value={Math.round((comparison.current / comparison.median - 1) * 100)} />
          )}
        </dd>
      </div>
      <dd className="font-numeric mt-2 text-[22px] font-semibold leading-none tracking-[-0.02em] tabular-nums">
        <AnimatedNumber value={sequenceKpiTotal(sequence, kpi.key)} format="compact" />
      </dd>
      <dd className="font-support mt-1.5 text-[12px] text-graphite">
        {rate === null ? "Instagram no devolvió este dato" : `${formatDecimal(rate)} cada 100 personas`}
        {comparison && comparison.median > 0 ? (
          <span className="text-muted"> · lo habitual es {formatDecimal(comparison.median)}</span>
        ) : null}
      </dd>
    </div>
  );
}

function Difference({ value }: { value: number }) {
  if (value === 0) return <>Igual que lo habitual</>;
  return (
    <>
      <strong className={`font-semibold ${value > 0 ? "text-success" : "text-danger"}`}>
        {Math.abs(value)} % {value > 0 ? "más" : "menos"}
      </strong>{" "}
      que lo habitual
    </>
  );
}

const dayFormatter = new Intl.DateTimeFormat("es-UY", {
  day: "numeric",
  month: "short",
  timeZone: "America/Montevideo",
});

/**
 * Esta secuencia frente a las de la ventana: la barra llena es esta, la línea punteada es
 * lo habitual. El detalle de cada barra aparece al instante al pasar el mouse.
 */
function RecentBars({ comparison }: { comparison: SequenceComparison }) {
  const scale = Math.max(comparison.median, ...comparison.recent.map((entry) => entry.value)) || 1;
  const currentId = comparison.recent.at(-1)?.id;
  const medianBottom = `${(comparison.median / scale) * 100}%`;

  return (
    <dd className="mt-auto pt-4">
      <div
        className="relative flex h-24 items-end gap-[2px]"
        role="img"
        aria-label={`Tus últimas ${comparison.recent.length} secuencias. Lo habitual: ${formatPercent(comparison.median)}`}
      >
        {comparison.recent.map((entry) => {
          const current = entry.id === currentId;
          const height = `${(entry.value / scale) * 100}%`;
          return (
            <div key={entry.id} className="group relative flex h-full flex-1 items-end">
              <div
                className={`bar-grow min-h-[3px] w-full rounded-t-[3px] transition-colors ${current ? "bg-data" : "bg-data/25 group-hover:bg-data/45"}`}
                style={{ height }}
              />
              <span
                className={`${TOOLTIP} left-1/2 mb-1.5 -translate-x-1/2`}
                style={{ bottom: height }}
              >
                {current ? "Esta · " : `${dayFormatter.format(new Date(entry.startedAt))} · `}
                {formatPercent(entry.value)}
              </span>
            </div>
          );
        })}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-ink/45"
          style={{ bottom: medianBottom }}
        />
      </div>
      <p className="font-support mt-1.5 flex items-center justify-between gap-2 text-[11px] text-muted">
        <span>Tus últimas {comparison.recent.length}</span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="w-3 border-t border-dashed border-ink/45" />
          {formatPercent(comparison.median)}
        </span>
      </p>
    </dd>
  );
}

type Row = {
  label: string;
  read: (story: RankedContentItem) => number | null;
  /** Salir es lo único que conviene que sea bajo: se tiñe en neutro para no premiarlo con el color de datos. */
  neutral?: boolean;
};

const rows: Row[] = [
  { label: "Personas", read: (story) => story.reach },
  { label: "Views", read: (story) => story.views },
  { label: "Respuestas", read: (story) => story.replies },
  { label: "Visitas al perfil", read: (story) => story.profileVisits },
  { label: "Seguidores ganados", read: (story) => story.follows },
  { label: "Compartidos", read: (story) => story.shares },
  { label: "Pasaron a la siguiente", read: (story) => story.storyForwardTaps },
  { label: "Volvieron a la anterior", read: (story) => story.storyBackTaps },
  { label: "Salieron", read: (story) => story.storyExits, neutral: true },
];

/**
 * Todas las métricas de cada Historia, una al lado de la otra. Cada celda se tiñe según su
 * peso dentro de la fila, así la Historia que más sumó —o por donde más se fue gente— salta
 * a la vista sin leer los números.
 */
function PerStoryTable({ stories }: { stories: RankedContentItem[] }) {
  return (
    <section className="rounded-card border border-mist bg-paper" aria-labelledby="per-story-title">
      <header className="flex items-center gap-2 border-b border-mist px-5 py-4">
        <h2 id="per-story-title" className="text-[15px] font-semibold text-ink">Por Historia</h2>
        <HelpHint text="Cuanto más intenso el fondo, más alto el valor en esa fila." />
      </header>
      <div className="overflow-x-auto p-2">
        <table className="font-support w-full min-w-max border-separate border-spacing-1 text-[13px]">
          <thead>
            <tr>
              <th scope="col" className="sr-only">Métrica</th>
              {stories.map((story, index) => (
                <th key={story.id} scope="col" className="px-3 pb-2 font-medium">
                  <span className="flex items-center justify-end gap-2 text-[12px] text-ink">
                    <span className="w-6 overflow-hidden rounded-[4px] border border-mist">
                      <ContentThumbnail item={story} />
                    </span>
                    Historia {index + 1}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const values = stories.map(row.read);
              const peak = Math.max(0, ...values.map((value) => value ?? 0));
              return (
                <tr key={row.label}>
                  <th scope="row" className="whitespace-nowrap px-3 py-2 text-left font-medium text-ink">{row.label}</th>
                  {values.map((value, index) => {
                    const share = value === null || peak === 0 ? 0 : value / peak;
                    const isPeak = share === 1;
                    return (
                      <td
                        key={stories[index].id}
                        className={`font-numeric rounded-[6px] px-3 py-2 text-right tabular-nums ${
                          isPeak ? "font-semibold text-ink" : "text-ink/80"
                        }`}
                        style={{
                          backgroundColor: `color-mix(in srgb, var(${row.neutral ? "--color-ink" : "--color-data"}) ${Math.round(share * (row.neutral ? 8 : 18))}%, transparent)`,
                        }}
                      >
                        {formatCompact(value)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
