"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Fila horizontal de la secuencia. Las flechas aparecen sólo hacia donde queda algo por ver,
 * así que con cuatro Historias o menos no hay controles.
 */
export function StoryStrip({ style, children }: { style: CSSProperties; children: ReactNode }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const measure = useCallback(() => {
    const element = scroller.current;
    if (!element) return;
    setEdges({
      start: element.scrollLeft <= 1,
      end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 1,
    });
  }, []);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [measure]);

  const page = (direction: 1 | -1) =>
    scroller.current?.scrollBy({ left: direction * scroller.current.clientWidth, behavior: "smooth" });

  return (
    <div className="relative">
      <div
        ref={scroller}
        onScroll={measure}
        style={style}
        className="grid snap-x snap-mandatory grid-flow-col grid-rows-[auto_auto] overflow-x-auto px-5 py-6 [scroll-padding-inline:20px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {edges.start ? null : (
        <StripButton label="Ver Historias anteriores" side="left" onClick={() => page(-1)}>
          <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={1.8} />
        </StripButton>
      )}
      {edges.end ? null : (
        <StripButton label="Ver Historias siguientes" side="right" onClick={() => page(1)}>
          <ChevronRight aria-hidden="true" className="size-4" strokeWidth={1.8} />
        </StripButton>
      )}
    </div>
  );
}

function StripButton({
  label,
  side,
  onClick,
  children,
}: {
  label: string;
  side: "left" | "right";
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`absolute top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-mist bg-paper text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 ${
        side === "left" ? "left-2" : "right-2"
      }`}
    >
      {children}
    </button>
  );
}
