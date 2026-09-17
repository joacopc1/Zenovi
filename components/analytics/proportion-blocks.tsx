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


/**
 * Una torta para un reparto de pocas partes con tamaños claramente distintos.
 *
 * Es la excepción a la regla de la casa —para partes parecidas los ángulos se comparan
 * peor que las longitudes—: con tres partes donde una se lleva casi el 80 %, la torta
 * dice "esto es casi todo" de un vistazo. La leyenda siempre trae el valor y el
 * porcentaje, así el dato exacto nunca depende de medir un ángulo.
 */
export function SharePie({ slices }: { slices: ProportionSlice[] }) {
  return (
    <div className="flex h-full flex-col items-center justify-between gap-5 sm:flex-row sm:items-center">
      <PieFigure slices={slices} />

      <dl className="flex w-full flex-col gap-3 sm:max-w-[240px]">
        {slices.map((slice) => (
          <div key={slice.key} className="flex items-center justify-between gap-3">
            <dt className="font-support flex items-center gap-2 text-[13px] text-ink">
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: slice.color }} />
              {slice.label}
            </dt>
            <dd className="flex items-baseline gap-2">
              <span className="font-numeric text-[13px] font-semibold">{formatNumber(slice.value)}</span>
              <span className="font-numeric w-12 text-right text-xs text-muted">
                {formatPercent(slice.share)}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const PIE_SIZE = 148;
const PIE_RADIUS = 70;

/** Los sectores se separan con un trazo del color de la superficie, no con un borde. */
function PieFigure({ slices }: { slices: ProportionSlice[] }) {
  const center = PIE_SIZE / 2;
  const sectors = slices.reduce<{ slice: ProportionSlice; start: number; end: number }[]>(
    (acc, slice) => {
      // Arranca arriba, como un reloj, y avanza en el sentido de las agujas.
      const start = acc.at(-1)?.end ?? -Math.PI / 2;
      return [...acc, { slice, start, end: start + slice.share * 2 * Math.PI }];
    },
    [],
  );

  return (
    <svg
      width={PIE_SIZE}
      height={PIE_SIZE}
      viewBox={`0 0 ${PIE_SIZE} ${PIE_SIZE}`}
      className="shrink-0"
      aria-hidden
    >
      {sectors.map(({ slice, start, end }) =>
        // Una parte que se lleva todo no tiene arco: es la circunferencia entera.
        slice.share >= 0.999 ? (
          <circle key={slice.key} cx={center} cy={center} r={PIE_RADIUS} fill={slice.color} />
        ) : (
          <path
            key={slice.key}
            d={sectorPath(center, PIE_RADIUS, start, end)}
            fill={slice.color}
            stroke="var(--color-paper)"
            strokeWidth="2"
          />
        ),
      )}
    </svg>
  );
}

function sectorPath(center: number, radius: number, start: number, end: number) {
  const from = { x: center + radius * Math.cos(start), y: center + radius * Math.sin(start) };
  const to = { x: center + radius * Math.cos(end), y: center + radius * Math.sin(end) };
  const largeArc = end - start > Math.PI ? 1 : 0;

  return `M ${center} ${center} L ${from.x} ${from.y} A ${radius} ${radius} 0 ${largeArc} 1 ${to.x} ${to.y} Z`;
}

/**
 * Un reparto ordenado por una escala propia —tramos de edad— en columnas.
 *
 * En columnas el orden natural se respeta y la forma del reparto se ve completa; en
 * filas ordenadas por tamaño se pierde justamente eso, que es lo que se quiere mirar.
 */
export function ShareColumns({ slices }: { slices: ProportionSlice[] }) {
  const peak = Math.max(...slices.map((slice) => slice.share), 0.01);

  return (
    <div className="flex h-full flex-col justify-end">
      <div className="flex h-[176px] items-end gap-2">
        {slices.map((slice, index) => (
          <div key={slice.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <span className="font-numeric text-[11px] font-semibold text-graphite">
              {formatPercent(slice.share)}
            </span>
            <div
              className="bar-grow w-full rounded-t-lg"
              style={{
                height: `${Math.max((slice.share / peak) * 100, 2)}%`,
                background: slice.color,
                animationDelay: `${index * 55}ms`,
              }}
            />
            <span className="font-support text-[11px] text-muted">{slice.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
