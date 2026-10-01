import type { ReactNode } from "react";

const SIDES = {
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
  bottom: "left-1/2 top-full mt-1 -translate-x-1/2",
} as const;

/**
 * El nombre de un ícono, al pasar el mouse o al enfocarlo con el teclado: propio, blanco y
 * al instante, nunca el `title` del navegador. El elemento que lo contiene lleva
 * `group/tip relative`.
 */
export function HoverLabel({ children, side = "bottom" }: { children: ReactNode; side?: keyof typeof SIDES }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-paper/90 px-2 py-1 text-[11px] font-normal text-ink opacity-0 ring ring-ink/10 backdrop-blur-lg transition-opacity duration-75 group-hover/tip:opacity-100 group-focus-visible/tip:opacity-100 ${SIDES[side]}`}
    >
      {children}
    </span>
  );
}
