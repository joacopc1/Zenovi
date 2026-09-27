import type { RankedContentItem } from "@/lib/content/library";
import {
  benchmarkDifference,
  getContentBenchmark,
  type ContentBenchmark,
  type ContentBenchmarkKey,
} from "@/lib/content/metrics";
import { ChartNoAxesColumnIncreasing } from "lucide-react";
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
 * Se usa "benchmark" y "views" a propósito, aunque haya palabras en español: es el
 * vocabulario con el que este mercado habla de su contenido, y traducirlo hace sonar a la
 * app como una herramienta de analítica genérica y no como alguien del rubro.
 */
export function BenchmarkSection({
  cohort,
  item,
}: {
  cohort: RankedContentItem[];
  item: RankedContentItem;
}) {
  const rows = definitions.flatMap((definition) => {
    const benchmark = getContentBenchmark(cohort, item.id, definition.key);
    return benchmark ? [{ ...definition, benchmark }] : [];
  });

  return (
    <section
      className="rounded-card border border-mist bg-paper px-5 py-4"
      aria-labelledby="benchmark-title"
    >
      <header className="border-b border-mist pb-4">
        <h2
          id="benchmark-title"
          className="flex items-center gap-2 text-[15px] font-semibold text-ink"
        >
          <ChartNoAxesColumnIncreasing aria-hidden="true" className="size-4 text-ink" strokeWidth={1.7} />
          Interacciones vs. tu benchmark
        </h2>
        <p className="font-support mt-1 text-[13px] text-graphite">
          Cada interacción como porcentaje de las views de esta pieza, contra tu benchmark
          de {cohort.length > 0 ? `${cohort.length} piezas` : "piezas"} del mismo formato.
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="font-support pt-4 text-[13px] leading-5 text-muted">
          Hacen falta al menos tres piezas medidas de este formato para armar un benchmark.
        </p>
      ) : (
        <dl className="divide-y divide-mist">
          <p className="font-support flex items-center gap-1.5 pt-3 text-[11px] text-muted">
            <span aria-hidden="true" className="inline-block h-3 w-px bg-ink" />
            La marca es tu benchmark. La barra que la pasa rindió por encima.
          </p>
          {rows.map((row) => (
            <Row
              key={row.key}
              label={row.label}
              count={row.count?.(item) ?? null}
              benchmark={row.benchmark}
            />
          ))}
        </dl>
      )}
    </section>
  );
}

function Row({
  label,
  count,
  benchmark,
}: {
  label: string;
  count: number | null;
  benchmark: ContentBenchmark;
}) {
  const difference = benchmarkDifference(benchmark);
  const above = difference !== null && difference > 0;

  // La escala deja aire arriba del mayor de los dos para que la marca del benchmark nunca
  // quede pegada al borde. Sin esa marca visible, la barra sola no dice contra qué se
  // compara: es una raya larga que hay que traducir leyendo los números de abajo.
  const scale = Math.max(benchmark.current, benchmark.median) * 1.15 || 1;
  const fill = Math.max(2, (benchmark.current / scale) * 100);
  const mark = (benchmark.median / scale) * 100;

  return (
    <div className="py-3 first:pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-[13px] font-medium text-ink">{label}</dt>
        <dd className="font-numeric text-[15px] font-semibold tabular-nums text-ink">
          {count === null ? "—" : formatCompact(count)}
        </dd>
      </div>

      <div className="relative mt-2 h-2 rounded-full bg-control">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            above ? "bg-success" : "bg-data"
          }`}
          style={{ width: `${fill}%` }}
        />
        {/* La marca es el benchmark. Que la barra la pase o no la alcance es todo lo que
            hay que leer; el número está abajo para quien quiera el detalle. */}
        <span
          className="absolute top-[-3px] h-[14px] w-px bg-ink"
          style={{ left: `${mark}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="font-support mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 text-[11px]">
        <span className="text-muted">
          <span className="font-numeric">{decimalFormatter.format(benchmark.current)}%</span> sobre
          views · benchmark{" "}
          <span className="font-numeric">{decimalFormatter.format(benchmark.median)}%</span>
        </span>
        {difference === null ? null : (
          <span
            className={`font-numeric font-semibold ${
              difference > 0 ? "text-success" : difference < 0 ? "text-danger" : "text-graphite"
            }`}
          >
            {difference === 0
              ? "en tu benchmark"
              : `${Math.abs(difference)}% más ${difference > 0 ? "alto" : "bajo"}`}
          </span>
        )}
      </div>
    </div>
  );
}
