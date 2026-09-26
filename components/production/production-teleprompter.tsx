"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, RotateCcw, X } from "lucide-react";
import { contentItemName } from "@/lib/production/content";
import { teleprompterWordsPerMinute, SCROLL_SPEEDS } from "@/lib/production/teleprompter";
import type { ContentItem } from "@/lib/data/production";

/** Dónde se recuerda la velocidad elegida: se graban varias tomas seguidas. */
const SPEED_KEY = "zenovi:teleprompter-speed";

/**
 * Modo grabación: el guion a pantalla completa, en texto grande, para leer frente a
 * cámara. Se marca dónde está el hook, el desarrollo y el CTA para no perderse.
 *
 * La velocidad se elige y se recuerda, porque es lo único que hace que un apuntador
 * sirva: leído demasiado rápido se atropella y demasiado lento se corta el ritmo, y cada
 * persona habla distinto. Se muestra en palabras por minuto —la unidad en la que alguien
 * puede reconocer su propio ritmo— y no en un número abstracto.
 */
export function ProductionTeleprompter({
  item,
  onClose,
}: {
  item: ContentItem;
  onClose: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(readStoredSpeed);
  const [distance, setDistance] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const parts = [
    { label: "Hook", text: item.hook },
    { label: "Desarrollo", text: item.development },
    { label: "CTA", text: item.cta },
  ].filter((part) => part.text.trim().length > 0);

  const speed = SCROLL_SPEEDS[speedIndex];
  const wordsPerMinute = teleprompterWordsPerMinute(
    parts.map((part) => part.text).join(" "),
    distance,
    speed,
  );

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

  // Cuánto hay para recorrer. Se vuelve a medir si cambia el tamaño: el cuerpo del texto
  // crece con el ancho de la ventana, así que la distancia no es un número fijo.
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const observer = new ResizeObserver(() => {
      setDistance(node.scrollHeight - node.clientHeight);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // El scroll avanza por tiempo transcurrido y no por cantidad de cuadros: con un
  // intervalo fijo, una pantalla de 120Hz corre el texto al doble que una de 60.
  useEffect(() => {
    if (!playing) return;

    let frame = 0;
    let previous = performance.now();

    const step = (now: number) => {
      const node = scrollRef.current;
      if (node) {
        node.scrollTop += (speed * (now - previous)) / 1000;
        if (node.scrollTop >= node.scrollHeight - node.clientHeight - 1) {
          setPlaying(false);
          return;
        }
      }
      previous = now;
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed]);

  function changeSpeed(delta: number) {
    setSpeedIndex((current) => {
      const next = Math.min(SCROLL_SPEEDS.length - 1, Math.max(0, current + delta));
      try {
        window.localStorage.setItem(SPEED_KEY, String(next));
      } catch {
        // Modo privado o almacenamiento bloqueado: la velocidad simplemente no se recuerda.
      }
      return next;
    });
  }

  function restart() {
    setPlaying(false);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Modo grabación: ${contentItemName(item)}`}
      className="fixed inset-0 z-50 flex flex-col bg-paper"
    >
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-mist px-5">
        <div className="flex min-w-0 items-center gap-3">
          <h2 className="hidden max-w-[32ch] truncate text-sm font-semibold sm:block">
            {contentItemName(item)}
          </h2>
          <button
            type="button"
            onClick={() => setPlaying((current) => !current)}
            className={`h-8 shrink-0 rounded-control px-3 text-[12px] font-medium transition-colors ${
              playing ? "bg-ink text-paper" : "bg-control text-ink"
            }`}
          >
            {playing ? "Pausar" : "Reproducir"}
          </button>
          <button
            type="button"
            onClick={restart}
            className="grid size-8 shrink-0 place-items-center rounded-control text-graphite transition-colors hover:text-ink"
            aria-label="Volver al principio"
          >
            <RotateCcw size={15} strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => changeSpeed(-1)}
            disabled={speedIndex === 0}
            className="grid size-8 place-items-center rounded-control border border-mist text-graphite transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-30"
            aria-label="Más lento"
          >
            <Minus size={14} strokeWidth={2} />
          </button>
          <span className="font-numeric w-[9ch] text-center text-[12px] text-graphite" aria-live="polite">
            {wordsPerMinute === null ? `${speed} px/s` : `${wordsPerMinute} pal/min`}
          </span>
          <button
            type="button"
            onClick={() => changeSpeed(1)}
            disabled={speedIndex === SCROLL_SPEEDS.length - 1}
            className="grid size-8 place-items-center rounded-control border border-mist text-graphite transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-30"
            aria-label="Más rápido"
          >
            <Plus size={14} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-2 grid size-8 place-items-center rounded-control text-graphite transition-colors hover:text-ink"
            aria-label="Cerrar modo grabación"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
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
          {/* Aire al final: sin esto la última línea del CTA queda pegada al borde y hay
              que leerla desde abajo de la pantalla, que es donde peor se lee. */}
          <div aria-hidden="true" className="h-[40vh]" />
        </div>
      </div>

      <footer className="shrink-0 border-t border-mist px-5 py-3 text-center text-[11px] text-muted">
        Espacio para pausar · Esc para salir
      </footer>
    </div>
  );
}

function readStoredSpeed(): number {
  try {
    const stored = Number(window.localStorage.getItem(SPEED_KEY));
    if (Number.isInteger(stored) && stored >= 0 && stored < SCROLL_SPEEDS.length) return stored;
  } catch {
    // Sin almacenamiento disponible se arranca en la velocidad media.
  }
  return Math.floor(SCROLL_SPEEDS.length / 2);
}
