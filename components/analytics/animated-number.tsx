"use client";

import { useEffect, useState } from "react";
import {
  formatCompact,
  formatDecimal,
  formatNumber,
  formatPercent,
  formatSigned,
} from "@/lib/format/numbers";

const formatters = {
  compact: formatCompact,
  number: formatNumber,
  decimal: formatDecimal,
  percent: formatPercent,
  signed: formatSigned,
};

export type NumberFormat = keyof typeof formatters;

const DURATION_MS = 650;

/**
 * La cifra sube desde cero al entrar, como un contador que termina de cargar.
 *
 * El primer render —servidor e hidratación— ya muestra el valor final: la animación
 * arranca recién en el efecto, así no hay salto de layout ni diferencia de hidratación.
 * Con "reducir movimiento" activado no se anima nada.
 */
export function AnimatedNumber({
  value,
  format,
}: {
  value: number | null;
  format: NumberFormat;
}) {
  const [shown, setShown] = useState(value);

  useEffect(() => {
    // Sin nada que contar —vacío, cero o "reducir movimiento"— el contador dura
    // un frame: el mismo camino deja la cifra final sin animarla.
    const duration =
      value === null || value === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : DURATION_MS;

    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const progress = duration === 0 ? 1 : Math.min((now - start) / duration, 1);
      // easeOutCubic: arranca rápido y frena sobre el número final.
      setShown(value === null ? null : value * (1 - (1 - progress) ** 3));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [value]);

  // Los enteros nunca muestran decimales a mitad de camino.
  const partial =
    shown === null || format === "percent" || format === "decimal" ? shown : Math.round(shown);

  // Cifras tabulares sólo mientras corre el contador: evitan el temblor de ancho.
  // Al llegar al final vuelven las proporcionales, que es como se diseñaron las cards.
  return (
    <span className={shown === value ? undefined : "tabular-nums"} suppressHydrationWarning>
      {formatters[format](partial)}
    </span>
  );
}
