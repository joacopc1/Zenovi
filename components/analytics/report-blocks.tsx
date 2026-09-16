import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, CircleHelp } from "lucide-react";
import { formatDecimal, formatNumber, formatPercent } from "@/lib/format/numbers";

export function ReportCard({
  title,
  hint,
  children,
}: {
  title: string;
  /** Qué mide la card, en una o dos frases: se lee al tocar el signo de pregunta. */
  hint?: string;
  children: ReactNode;
}) {
  return (
    // h-full: en una fila, todas las cards terminan a la misma altura.
    <div className="flex h-full flex-col rounded-card border border-mist bg-paper p-5">
      <CardTitle title={title} hint={hint} />
      <div className="mt-4">{children}</div>
    </div>
  );
}

/** Título de card con su ayuda al lado, como la usa Polar: discreta hasta que la buscás. */
export function CardTitle({
  title,
  hint,
  trailing,
}: {
  title: string;
  hint?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h3 className="flex items-center gap-1.5 text-[15px] font-semibold tracking-[-0.01em]">
        {title}
        {hint ? <HelpHint text={hint} /> : null}
      </h3>
      {trailing}
    </div>
  );
}

/**
 * El signo de pregunta que explica una card. Sin JavaScript: aparece al pasar el mouse
 * y también al llegar con el teclado, así que funciona igual sin mouse.
 */
export function HelpHint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={`Qué mide: ${text}`}
        className="flex text-muted transition-colors hover:text-graphite focus-visible:text-graphite focus-visible:outline-none"
      >
        <CircleHelp size={14} strokeWidth={1.75} aria-hidden />
      </button>
      {/* `hidden` y no `invisible`: un cuadro oculto con `visibility` sigue ocupando caja
          y estira el área scrolleable de la página, aunque no se vea. */}
      <span
        role="tooltip"
        className="font-support pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden w-60 -translate-x-1/2 rounded-control border border-mist bg-paper p-3 text-xs font-normal leading-5 text-graphite shadow-[0_8px_24px_rgba(0,0,0,0.1)] group-hover:block group-focus-within:block"
      >
        {text}
      </span>
    </span>
  );
}

/**
 * Una tasa contada entera: el porcentaje, la barra que lo representa y las dos cifras
 * de las que sale. Una tasa sin sus términos es difícil de juzgar —3,6% de 167 no es lo
 * mismo que 3,6% de 12— y la comparación contra el período anterior va en puntos
 * porcentuales, que es como se compara una tasa contra otra.
 */
export function RateTile({
  label,
  icon,
  hint,
  value,
  previous,
  numerator,
  denominator,
  unit,
  over,
  color,
}: {
  label: string;
  icon: ReactNode;
  hint?: string;
  value: number | null;
  previous: number | null;
  numerator: number | null;
  denominator: number | null;
  unit: string;
  over: string;
  color: string;
}) {
  const points = value !== null && previous !== null ? (value - previous) * 100 : null;

  return (
    <div className="flex h-full flex-col rounded-card border border-mist bg-paper px-5 py-4">
      <p className="font-support flex items-center gap-1.5 text-xs font-medium tracking-[0.01em] text-graphite">
        <span aria-hidden="true" className="flex" style={{ color }}>
          {icon}
        </span>
        {label}
        {hint ? <HelpHint text={hint} /> : null}
      </p>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-numeric text-[26px] font-bold leading-tight tracking-[-0.02em]">
          {formatPercent(value)}
        </span>
        {points === null ? null : (
          <span
            className={`font-numeric flex items-center gap-0.5 text-xs font-semibold ${
              points > 0 ? "text-success" : points < 0 ? "text-danger" : "text-muted"
            }`}
          >
            {points > 0 ? <ArrowUpRight size={13} strokeWidth={2} aria-hidden /> : null}
            {points < 0 ? <ArrowDownRight size={13} strokeWidth={2} aria-hidden /> : null}
            {formatDecimal(Math.abs(points))} pts
          </span>
        )}
      </div>

      <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-control">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min((value ?? 0) * 100, 100)}%`, background: color }}
        />
      </div>

      <p className="font-support mt-2.5 text-xs text-muted">
        {numerator === null || denominator === null
          ? `${unit} sobre ${over}`
          : `${formatNumber(numerator)} ${unit} de ${formatNumber(denominator)} ${over}`}
      </p>
    </div>
  );
}

export type StatChip = {
  label: string;
  value: string;
  icon: ReactNode;
  /** Colorea el valor cuando representa una variación: verde sube, rojo baja. */
  tone?: "up" | "down" | "neutral";
};

/** Cifras de apoyo de una card, debajo de su gráfico: pequeñas, con ícono y sin ruido. */
export function StatChips({ items }: { items: StatChip[] }) {
  return (
    <dl className="grid gap-2 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-control border border-mist bg-paper px-3 py-2.5">
          <dt className="font-support flex items-center gap-1.5 text-[11px] text-muted">
            <span aria-hidden="true" className="flex text-graphite">
              {item.icon}
            </span>
            {item.label}
          </dt>
          <dd
            className={`font-numeric mt-1.5 flex items-center gap-1 text-[18px] font-bold leading-none tracking-[-0.02em] ${
              item.tone === "up" ? "text-success" : item.tone === "down" ? "text-danger" : "text-ink"
            }`}
          >
            {item.tone === "up" ? <ArrowUpRight size={15} strokeWidth={2} aria-hidden /> : null}
            {item.tone === "down" ? <ArrowDownRight size={15} strokeWidth={2} aria-hidden /> : null}
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function PendingPanel({
  title,
  items,
  reason,
}: {
  title: string;
  items: string[];
  reason: string;
}) {
  return (
    <div className="rounded-card border border-mist bg-canvas p-5">
      <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h3>
      <p className="font-support mt-1 text-xs font-semibold text-muted">Sin conectar</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item} className="font-support rounded-control border border-mist bg-paper px-2.5 py-1 text-xs text-graphite">
            {item}
          </li>
        ))}
      </ul>
      <p className="font-support mt-3 max-w-2xl text-xs leading-5 text-muted">{reason}</p>
    </div>
  );
}
