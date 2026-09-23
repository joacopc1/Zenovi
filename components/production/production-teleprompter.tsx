"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { contentItemName } from "@/lib/production/content";
import type { ContentItem } from "@/lib/data/production";

/**
 * Modo grabación: el guion completo a pantalla, en texto grande, listo para leer
 * frente a cámara. Scroll manual con la rueda o arrastrando; se marca dónde está el
 * hook, el desarrollo y el CTA para no perderse.
 */
export function ProductionTeleprompter({
  item,
  onClose,
}: {
  item: ContentItem;
  onClose: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === " ") {
        event.preventDefault();
        setPlaying((current) => !current);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      scrollRef.current?.scrollBy({ top: 1.2, behavior: "auto" });
    }, 30);
    return () => clearInterval(interval);
  }, [playing]);

  const parts = [
    { label: "Hook", text: item.hook },
    { label: "Desarrollo", text: item.development },
    { label: "CTA", text: item.cta },
  ].filter((part) => part.text.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-mist px-5">
        <div className="flex items-center gap-3">
          <h2 className="max-w-[40ch] truncate text-sm font-semibold">{contentItemName(item)}</h2>
          <button
            type="button"
            onClick={() => setPlaying((current) => !current)}
            className={`h-8 rounded-control px-3 text-[12px] font-medium transition-colors ${
              playing ? "bg-ink text-paper" : "bg-control text-ink"
            }`}
          >
            {playing ? "Pausar" : "Reproducir"}
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid size-8 place-items-center rounded-control text-graphite transition-colors hover:text-ink"
          aria-label="Cerrar modo grabación"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </header>

      <div
        ref={scrollRef}
        className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-6 py-10"
        aria-label="Guion en modo grabación"
      >
        <div className="mx-auto max-w-2xl">
          {parts.map((part) => (
            <section key={part.label} className="mb-10">
              <span className="mb-3 inline-block rounded-full border border-mist px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                {part.label}
              </span>
              <p className="text-[clamp(1.75rem,1.5rem+2vw,2.75rem)] font-medium leading-[1.45] tracking-[-0.01em] text-ink">
                {part.text}
              </p>
            </section>
          ))}
        </div>
      </div>

      <footer className="shrink-0 border-t border-mist px-5 py-3 text-center text-[11px] text-muted">
        Espacio para pausar · Esc para salir
      </footer>
    </div>
  );
}
