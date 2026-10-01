import {
  comparableContentItems,
  type RankedContentItem,
} from "@/lib/content/library";
import {
  benchmarkDifference,
  getContentBenchmark,
  type ContentBenchmark,
  type ContentBenchmarkKey,
} from "@/lib/content/metrics";
import { ChartNoAxesColumnIncreasing } from "lucide-react";
import { HelpHint } from "@/components/ui/help-hint";
import { formatCompact } from "@/lib/format/numbers";

const decimalFormatter = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 2 });

type Definition = {
  key: ContentBenchmarkKey;
  label: string;
  /** De dónde sale el número crudo que acompaña al porcentaje. */
  count?: (item: RankedContentItem) => number | null;
};

/**
 * Las cuatro acciones, en el orden en que cuestan: un me gusta es gratis, compartir es
 * poner la cara. Que una pieza se despegue en guardados o compartidos dice más que un
 * pico de me gusta.
 */
const definitions: Definition[] = [
  { key: "likes", label: "Me gusta", count: (item) => item.likes },
  { key: "comments", label: "Comentarios", count: (item) => item.comments },
  { key: "saves", label: "Guardados", count: (item) => item.saves },
  { key: "shares", label: "Compartidos", count: (item) => item.shares },
];

/**
 * Cada interacción de esta pieza contra el benchmark de la cuenta.
 *
 * El número crudo no dice si estuvo bien: 4.500 guardados pueden ser muchos o pocos según
 * cuántos la vieron y según cómo suele guardarse lo que hace esta cuenta. Por eso se
 * compara la proporción —saves sobre views— contra la mediana del formato, y se informa la
 * distancia en por ciento, que es como se piensa: "57% más alto".
 *
 * En la interfaz se habla de lo habitual dentro del formato de la pieza: es el mismo
 * benchmark estadístico, expresado como la comparación concreta que necesita quien
 * gestiona su marca personal.
 */
export function BenchmarkSection({
  cohort,
  item,
}: {
  cohort: RankedContentItem[];
  item: RankedContentItem;
}) {
  const copy = benchmarkCopy(item);
  const comparableCohort = comparableContentItems(cohort, item);
  const rows = definitions.flatMap((definition) => {
    const benchmark = getContentBenchmark(comparableCohort, item.id, definition.key);
    return benchmark ? [{ ...definition, benchmark }] : [];
  });
  const scale = Math.max(
    ...rows.flatMap(({ benchmark }) => [benchmark.current, benchmark.median]),
    0.1,
  );

  return (
    <section
      className="h-full rounded-card border border-mist bg-paper px-5 py-4"
      aria-labelledby="benchmark-title"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-mist pb-4">
        <h2
          id="benchmark-title"
          className="flex items-center gap-2 text-[15px] font-semibold text-ink"
        >
          <ChartNoAxesColumnIncreasing aria-hidden="true" className="size-4 text-ink" strokeWidth={1.7} />
          Interacciones vs. tu benchmark
          <HelpHint text={`Sirve para comparar las interacciones de ${copy.demonstrative} con el rendimiento habitual de ${copy.habitual}. Se activa cuando hay al menos tres piezas medidas.`} />
        </h2>
        {rows.length > 0 ? (
          <div className="font-support flex items-center gap-3 text-[10px] text-muted">
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2 rounded-sm bg-ink" />
              {copy.current}
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2 rounded-sm bg-control" />
              Habitual
            </span>
          </div>
        ) : null}
      </header>

      {rows.length === 0 ? (
        <p className="font-support pt-4 text-[13px] leading-5 text-muted">
          Hacen falta al menos tres piezas medidas de este formato para armar un benchmark.
        </p>
      ) : (
        <div
          className="grid grid-cols-2 divide-x divide-mist pt-1 sm:grid-cols-4"
          aria-label="Comparación de interacciones sobre visualizaciones"
        >
          {rows.map((row) => (
            <BarGroup
              key={row.key}
              label={row.label}
              count={row.count?.(item) ?? null}
              benchmark={row.benchmark}
              scale={scale}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function BarGroup({
  label,
  count,
  benchmark,
  scale,
}: {
  label: string;
  count: number | null;
  benchmark: ContentBenchmark;
  scale: number;
}) {
  const difference = benchmarkDifference(benchmark);
  const currentHeight = barHeight(benchmark.current, scale);
  const medianHeight = barHeight(benchmark.median, scale);

  return (
    <div className="min-w-0 px-3 py-4 sm:px-5">
      <p className="truncate text-[12px] font-medium text-ink">{label}</p>
      <p className="font-numeric mt-1 text-[23px] font-semibold leading-none tracking-[-0.025em] tabular-nums text-ink">
        {decimalFormatter.format(benchmark.current)}%
      </p>
      <p
        className={`font-numeric mt-1 min-h-4 text-[10px] font-semibold tabular-nums ${
          difference === null || difference === 0
            ? "text-muted"
            : difference > 0
              ? "text-success"
              : "text-danger"
        }`}
      >
        {difference === null
          ? "Sin referencia"
          : difference === 0
            ? "Igual que lo habitual"
            : `${Math.abs(difference)}% ${difference > 0 ? "arriba" : "abajo"}`}
      </p>

      <div className="mt-3 flex h-12 items-end gap-1.5 border-b border-mist">
        <VerticalBar
          label={label}
          series="Esta pieza"
          value={benchmark.current}
          height={currentHeight}
          count={count}
          className="bg-ink"
        />
        <VerticalBar
          label={label}
          series="Tu mediana"
          value={benchmark.median}
          height={medianHeight}
          className="bg-control"
        />
      </div>
    </div>
  );
}

function VerticalBar({
  label,
  series,
  value,
  height,
  count,
  className,
}: {
  label: string;
  series: "Esta pieza" | "Tu mediana";
  value: number;
  height: number;
  count?: number | null;
  className: string;
}) {
  return (
    <div
      className="group/bar relative flex h-full w-7 items-end outline-none sm:w-9"
      role="img"
      tabIndex={0}
      aria-label={`${label}, ${series}: ${decimalFormatter.format(value)}% de las visualizaciones`}
    >
      <span
        aria-hidden="true"
        className={`block w-full rounded-t-[4px] transition-[height] duration-500 ${className}`}
        style={{ height: `${height}%` }}
      />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden min-w-20 -translate-x-1/2 whitespace-nowrap rounded-control border border-mist bg-paper px-2.5 py-2 text-left group-hover/bar:block group-focus-visible/bar:block">
        <span className="font-numeric block text-[13px] font-semibold tabular-nums text-ink">
          {decimalFormatter.format(value)}%
        </span>
        {series === "Esta pieza" && count !== undefined ? (
          <span className="font-support mt-0.5 block text-[10px] text-graphite">
            {count === null ? "Sin datos" : `${formatCompact(count)} interacciones`}
          </span>
        ) : null}
      </span>
    </div>
  );
}

function benchmarkCopy(item: RankedContentItem) {
  if (item.comparisonFormat === "carousel") {
    return {
      current: "Carrusel",
      demonstrative: "este carrusel",
      habitual: "tus carruseles",
    };
  }
  if (item.comparisonFormat === "video") {
    return {
      current: "Video",
      demonstrative: "este video",
      habitual: "tus videos",
    };
  }
  if (item.kind === "publication") {
    return {
      current: "Post",
      demonstrative: "este post",
      habitual: "tus posts",
    };
  }
  if (item.kind === "story") {
    return {
      current: "Historia",
      demonstrative: "esta historia",
      habitual: "tus historias",
    };
  }
  return {
    current: "Reel",
    demonstrative: "este Reel",
    habitual: "tus Reels",
  };
}

function barHeight(value: number, scale: number) {
  if (value <= 0) return 2;
  return Math.max(8, (value / scale) * 100);
}
