"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { CircleHelp } from "lucide-react";
import { placeTooltip } from "@/lib/ui/tooltip-position";

/**
 * Ayuda contextual para conceptos analíticos. No ocupa espacio hasta que alguien la
 * busca con el mouse o el teclado, y mantiene accesible la explicación completa.
 */
export function HelpHint({ text }: { text: string }) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<ReturnType<typeof placeTooltip> | null>(null);

  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      const tooltip = tooltipRef.current;
      if (!trigger || !tooltip) return;

      setPosition(
        placeTooltip(trigger.getBoundingClientRect(), tooltip.getBoundingClientRect(), {
          width: window.innerWidth,
          height: window.innerHeight,
        }),
      );
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <span
      className="inline-flex"
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Para qué sirve: ${text}`}
        aria-describedby={open ? tooltipId : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="flex text-muted transition-colors hover:text-graphite focus-visible:text-graphite focus-visible:outline-none"
      >
        <CircleHelp size={14} strokeWidth={1.75} aria-hidden />
      </button>
      <span
        ref={tooltipRef}
        id={tooltipId}
        role="tooltip"
        data-side={position?.side}
        style={position ? { left: position.left, top: position.top } : undefined}
        className={`font-support pointer-events-none fixed z-50 w-60 rounded-control border border-mist bg-paper p-3 text-xs font-normal leading-5 text-graphite ${open && position ? "visible" : "invisible"}`}
      >
        {text}
      </span>
    </span>
  );
}
