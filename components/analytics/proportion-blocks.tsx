import type { ReactNode } from "react";
import { formatNumber, formatPercent } from "@/lib/format/numbers";

export type ProportionSlice = {
  key: string;
  label: string;
  color: string;
  value: number;
  share: number;
  icon?: ReactNode;
};

/**
 * Reparto de un total, una fila por parte: ícono, nombre, valor, porcentaje y una barra
 * fina con su proporción. Reemplaza a la dona: con partes de tamaño parecido, las
 * longitudes se comparan mejor que los ángulos, y cada fila se lee sin buscar el color.
 */
export function ProportionBar({ slices }: { slices: ProportionSlice[] }) {
  return (
    <dl className="space-y-3.5">
      {slices.map((slice) => (
        <div key={slice.key}>
          <div className="flex items-center justify-between gap-3 text-[13px]">
            <dt className="font-support flex items-center gap-2 text-graphite">
              {slice.icon ? (
                <span aria-hidden="true" style={{ color: slice.color }} className="flex">
                  {slice.icon}
                </span>
              ) : (
                <span aria-hidden="true" className="size-2 rounded-full" style={{ background: slice.color }} />
              )}
              {slice.label}
            </dt>
            <dd className="font-numeric tabular-nums">
              {formatNumber(slice.value)}
              <span className="ml-2 text-muted">{formatPercent(slice.share)}</span>
            </dd>
          </div>
          <div aria-hidden="true" className="mt-1.5 h-[3px] rounded-full bg-control">
            <span
              className="block h-full rounded-full"
              style={{ width: `${Math.max(slice.share * 100, slice.value > 0 ? 2 : 0)}%`, background: slice.color }}
            />
          </div>
        </div>
      ))}
    </dl>
  );
}

