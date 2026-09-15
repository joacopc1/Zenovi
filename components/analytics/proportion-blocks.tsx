import { formatNumber, formatPercent } from "@/lib/format/numbers";

export type ProportionSlice = { key: string; label: string; color: string; value: number; share: number };

/**
 * Reparto de un total en una barra horizontal. Reemplaza a la dona: con partes de
 * tamaño parecido, las longitudes se comparan mejor que los ángulos.
 */
export function ProportionBar({ slices }: { slices: ProportionSlice[] }) {
  return (
    <div>
      <div className="flex h-3 w-full gap-[2px]" aria-hidden="true">
        {slices
          .filter((slice) => slice.value > 0)
          .map((slice) => (
            <span
              key={slice.key}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ flexGrow: slice.value, flexBasis: 0, background: slice.color }}
            />
          ))}
      </div>

      <dl className="mt-4 space-y-2.5">
        {slices.map((slice) => (
          <div key={slice.key} className="flex items-center justify-between gap-3 text-[13px]">
            <dt className="flex items-center gap-2 text-graphite">
              <span aria-hidden="true" className="size-2 rounded-full" style={{ background: slice.color }} />
              {slice.label}
            </dt>
            <dd className="tabular-nums">
              {formatNumber(slice.value)}
              <span className="ml-2 text-muted">{formatPercent(slice.share)}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
