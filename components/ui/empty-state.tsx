import type { ReactNode } from "react";

export type EmptyIllustration = "calendar" | "spotlight" | "caught-up" | "chart" | "chat" | "audience";

/**
 * Lo que muestra una card cuando todavía no tiene nada: un dibujo chico, una frase y una
 * acción, centrados en la card entera. Nunca una frase suelta en una card a medio llenar.
 */
export function EmptyState({
  illustration,
  title,
  description,
  action,
  className = "",
}: {
  illustration: EmptyIllustration;
  title: string;
  description: string;
  action?: ReactNode;
  /** Para fijar el alto cuando reemplaza a una gráfica, así la card no cambia de tamaño. */
  className?: string;
}) {
  return (
    <div className={`flex flex-1 flex-col items-center justify-center px-4 py-6 text-center ${className}`}>
      <span aria-hidden="true">{ILLUSTRATIONS[illustration]}</span>
      <p className="mt-4 text-[14px] font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-[30ch] text-[13px] leading-5 text-graphite">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

const stroke = "var(--color-mist-strong)";
const ink = "var(--color-ink)";
const paper = "var(--color-paper)";
const canvas = "var(--color-canvas)";

const ILLUSTRATIONS: Record<EmptyIllustration, ReactNode> = {
  // Una hoja de calendario con un día marcado y una tarjeta que asoma por delante.
  calendar: (
    <svg width="112" height="76" viewBox="0 0 112 76" fill="none">
      <rect x="14" y="6" width="84" height="62" rx="10" fill={canvas} stroke={stroke} />
      <path d="M14 22h84" stroke={stroke} />
      {[0, 1, 2, 3, 4, 5].map((column) => (
        <rect key={column} x={22 + column * 12.5} y="12" width="6" height="4" rx="2" fill={stroke} />
      ))}
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3, 4, 5].map((column) => (
          <rect key={`${row}-${column}`} x={21 + column * 12.5} y={28 + row * 12} width="8" height="8" rx="2.5" fill={row === 1 && column === 3 ? ink : paper} stroke={row === 1 && column === 3 ? ink : stroke} />
        )),
      )}
      <rect x="58" y="46" width="48" height="24" rx="7" fill={paper} stroke={stroke} />
      <rect x="65" y="53" width="26" height="4" rx="2" fill={ink} />
      <rect x="65" y="61" width="16" height="3" rx="1.5" fill={stroke} />
    </svg>
  ),
  // Tres piezas en fila: la del medio, más alta y con una estrella, es la que se destacó.
  spotlight: (
    <svg width="112" height="76" viewBox="0 0 112 76" fill="none">
      <rect x="10" y="20" width="26" height="44" rx="6" fill={canvas} stroke={stroke} />
      <rect x="76" y="20" width="26" height="44" rx="6" fill={canvas} stroke={stroke} />
      <rect x="40" y="8" width="32" height="60" rx="7" fill={paper} stroke={ink} strokeWidth="1.25" />
      <path d="m56 28 3 6 6.5.9-4.7 4.6 1.1 6.5L56 43l-5.9 3 1.1-6.5-4.7-4.6 6.5-.9Z" fill={ink} />
      <rect x="47" y="54" width="18" height="3" rx="1.5" fill={stroke} />
    </svg>
  ),
  // Un tilde dentro de dos anillos: está todo al día.
  "caught-up": (
    <svg width="76" height="76" viewBox="0 0 76 76" fill="none">
      <circle cx="38" cy="38" r="34" fill={canvas} stroke={stroke} strokeDasharray="3 4" />
      <circle cx="38" cy="38" r="20" fill={paper} stroke={stroke} />
      <path d="m30 38.5 5.5 5.5L47 32.5" stroke={ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  // Barras con el borde punteado: la gráfica está, falta el dato.
  chart: (
    <svg width="112" height="70" viewBox="0 0 112 70" fill="none">
      <path d="M8 62h96" stroke={stroke} />
      {[18, 30, 22, 40, 28, 48].map((height, index) => (
        <rect key={index} x={14 + index * 15} y={62 - height} width="9" height={height} rx="3" fill={index === 5 ? paper : canvas} stroke={index === 5 ? ink : stroke} strokeDasharray={index === 5 ? "3 3" : undefined} />
      ))}
    </svg>
  ),
  // Dos globos de conversación.
  chat: (
    <svg width="96" height="70" viewBox="0 0 96 70" fill="none">
      <rect x="8" y="8" width="56" height="30" rx="10" fill={canvas} stroke={stroke} />
      <rect x="18" y="18" width="30" height="4" rx="2" fill={stroke} />
      <rect x="18" y="26" width="20" height="4" rx="2" fill={stroke} />
      <rect x="32" y="34" width="56" height="28" rx="10" fill={paper} stroke={ink} strokeWidth="1.25" />
      <rect x="42" y="44" width="34" height="4" rx="2" fill={ink} />
      <rect x="42" y="52" width="18" height="3" rx="1.5" fill={stroke} />
    </svg>
  ),
  // Tres personas, la del medio adelante.
  audience: (
    <svg width="104" height="70" viewBox="0 0 104 70" fill="none">
      <circle cx="28" cy="26" r="9" fill={canvas} stroke={stroke} />
      <path d="M12 58c2-10 9-15 16-15s14 5 16 15" fill={canvas} stroke={stroke} />
      <circle cx="76" cy="26" r="9" fill={canvas} stroke={stroke} />
      <path d="M60 58c2-10 9-15 16-15s14 5 16 15" fill={canvas} stroke={stroke} />
      <circle cx="52" cy="22" r="11" fill={paper} stroke={ink} strokeWidth="1.25" />
      <path d="M32 62c2-12 11-18 20-18s18 6 20 18" fill={paper} stroke={ink} strokeWidth="1.25" />
    </svg>
  ),
};
