import {
  getPerformanceSignal,
  type PerformanceSignal,
} from "@/lib/content/metrics";

const multiplierFormatter = new Intl.NumberFormat("es-UY", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Cuántas veces rindió una pieza respecto de la mediana de su formato.
 * No se renderiza cuando no hay base comparable: es preferible no decir nada
 * a insinuar una precisión que no tenemos.
 */
export function PerformanceBadge({
  multiplier,
  className = "",
  showUnavailable = false,
  overlay = false,
}: {
  multiplier: number | null;
  className?: string;
  showUnavailable?: boolean;
  overlay?: boolean;
}) {
  if (multiplier === null && !showUnavailable) return null;

  const presentation = getPresentation(multiplier);
  const value = multiplier === null ? "Sin referencia" : `×${multiplierFormatter.format(multiplier)}`;

  return (
    <span
      title={
        multiplier === null
          ? "Todavía no existe una referencia suficiente para comparar esta pieza"
          : `Rindió ${multiplierFormatter.format(multiplier)} veces la mediana de este formato`
      }
      className={`font-support pointer-events-none z-10 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold leading-none tabular-nums ${
        overlay
          ? `border-white/20 bg-black/55 backdrop-blur-sm ${presentation.overlayClassName}`
          : `bg-transparent ${presentation.className}`
      } ${className}`}
    >
      <DeltaIcon direction={presentation.direction} />
      {value}
    </span>
  );
}

function getPresentation(multiplier: number | null): {
  direction: PerformanceSignal;
  className: string;
  overlayClassName: string;
} {
  const direction = getPerformanceSignal(multiplier);

  if (direction === "up") {
    return {
      direction,
      className: "border-success/30 text-success",
      overlayClassName: "text-[#7ee2ae]",
    };
  }

  if (direction === "down") {
    return {
      direction,
      className: "border-danger/30 text-danger",
      overlayClassName: "text-[#ff9aa2]",
    };
  }

  return {
    direction: "right",
    className: "border-mist-strong text-graphite",
    overlayClassName: "text-white/75",
  };
}

function DeltaIcon({ direction }: { direction: PerformanceSignal }) {
  const points = {
    up: "6 3 10 9 2 9",
    down: "2 3 10 3 6 9",
    right: "3 2 9 6 3 10",
  }[direction];

  return (
    <svg viewBox="0 0 12 12" className="size-3 shrink-0" fill="currentColor" aria-hidden="true">
      <polygon points={points} />
    </svg>
  );
}
