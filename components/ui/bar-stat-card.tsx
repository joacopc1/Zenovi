import type { ReactNode } from "react";
import { AnimatedNumber, type NumberFormat } from "@/components/analytics/animated-number";
import { CardTitle } from "@/components/analytics/report-blocks";

/**
 * Card de cifra con barras (21st.dev, "Stats Card" de @lavikatiyar).
 *
 * Adaptada a Zenovi: tokens y tipografía propios, el contador de números que ya usa
 * el resto del informe, y las barras crecen con una animación CSS en vez de traer
 * framer-motion sólo para esto. El último tramo va destacado porque es el más
 * reciente: es el que la persona está mirando.
 */
export type StatBar = { label: string; value: number };

export function BarStatCard({
  title,
  hint,
  value,
  format = "number",
  description,
  bars,
}: {
  title: string;
  hint?: string;
  value: number | null;
  format?: NumberFormat;
  description: ReactNode;
  bars: StatBar[];
}) {
  const peak = Math.max(...bars.map((bar) => bar.value), 1);

  return (
    <div className="flex h-full flex-col rounded-card border border-mist bg-paper p-5">
      <CardTitle title={title} hint={hint} />

      <p className="font-numeric mt-3 text-[30px] font-bold leading-none tracking-[-0.02em]">
        <AnimatedNumber value={value} format={format} />
      </p>
      <p className="font-support mt-1.5 text-xs text-muted">{description}</p>

      {bars.length > 0 ? (
        <div className="mt-auto flex h-28 items-end gap-3 pt-6">
          {bars.map((bar, index) => (
            <div key={`${bar.label}-${index}`} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div
                className={`bar-grow w-full rounded-t-lg ${index === bars.length - 1 ? "bg-data" : "bg-data/25"}`}
                // Un tramo sin nada publicado se sigue viendo como un hilo: dice "acá no publicaste".
                style={{ height: `${Math.max((bar.value / peak) * 100, 3)}%`, animationDelay: `${index * 55}ms` }}
              />
              <span className="font-support text-[11px] text-muted">{bar.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
