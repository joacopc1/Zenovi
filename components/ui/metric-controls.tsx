"use client";

/**
 * Controles de la Progress Metric Card (21st.dev, @makviesainte), reconstruidos: el
 * registro no publica este archivo sin autenticación.
 *
 * El original incluía además un selector de período dentro de la card. En Zenovi el
 * período lo decide un único filtro arriba de la página, así que ese control no existe:
 * dos cards con períodos distintos darían cifras que no se pueden comparar.
 */
import { ChartColumn, ChartSpline } from "lucide-react";
import type { ChartView } from "./metric-chart";

const views: { value: ChartView; label: string }[] = [
  { value: "curve", label: "Ver como curva" },
  { value: "bars", label: "Ver como barras" },
];

export function ViewToggle({
  value,
  onChange,
}: {
  value: ChartView;
  onChange: (view: ChartView) => void;
}) {
  return (
    // El contenido de la card deja pasar el mouse al gráfico; los botones lo recuperan.
    <div
      role="group"
      aria-label="Tipo de gráfico"
      className="pointer-events-auto flex items-center gap-0.5 rounded-control border border-mist bg-paper p-0.5"
    >
      {views.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.label}
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`grid size-6 place-items-center rounded-[0.4rem] transition-colors ${
              selected ? "bg-ink/[0.065] text-ink" : "text-muted hover:text-ink"
            }`}
          >
            {/* Trazo más fino que el de Lucide por defecto: línea limpia, estilo Apple. */}
            {option.value === "curve" ? (
              <ChartSpline size={14} strokeWidth={1.75} aria-hidden />
            ) : (
              <ChartColumn size={14} strokeWidth={1.75} aria-hidden />
            )}
          </button>
        );
      })}
    </div>
  );
}


