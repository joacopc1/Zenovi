"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, CalendarRange, Command, FileText, Lightbulb, LoaderIcon, ScanSearch } from "lucide-react";

/**
 * La caja para hablar con el Director. Es el componente `animated-ai-chat` de la colección
 * de 21st.dev con su composición y sus efectos (vidrio, comandos con "/", chips); lo único
 * que cambia es la paleta, clara y con el azul de datos de Zenovi donde el original usaba
 * violeta, y no lleva el brillo que seguía al mouse (lo pidió Joaco).
 */

type DirectorCommand = { icon: ReactNode; label: string; description: string; prefix: string };

export const DIRECTOR_COMMANDS: DirectorCommand[] = [
  { icon: <Lightbulb className="size-4" strokeWidth={1.7} />, label: "Ideas", description: "Ideas de contenido para grabar", prefix: "/idea" },
  { icon: <FileText className="size-4" strokeWidth={1.7} />, label: "Guion", description: "Un guion listo para grabar", prefix: "/guion" },
  { icon: <ScanSearch className="size-4" strokeWidth={1.7} />, label: "Analizar", description: "Qué conservar, qué cambiar y qué probar", prefix: "/analizar" },
  { icon: <CalendarRange className="size-4" strokeWidth={1.7} />, label: "Plan", description: "Un plan de publicación para los próximos días", prefix: "/plan" },
];

function useAutoResizeTextarea({ minHeight, maxHeight }: { minHeight: number; maxHeight: number }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.style.height = `${minHeight}px`;
      if (reset) return;
      textarea.style.height = `${Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight))}px`;
    },
    [minHeight, maxHeight],
  );

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
  }, [minHeight]);

  return { textareaRef, adjustHeight };
}

export function DirectorComposer({
  onSend,
  busy,
  creditsLabel,
  showSuggestions,
}: {
  onSend: (text: string) => void;
  busy: boolean;
  /** "Te quedan 1.320 créditos": el uso también se ve donde se gasta. */
  creditsLabel: string;
  showSuggestions: boolean;
}) {
  const [value, setValue] = useState("");
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 60, maxHeight: 200 });
  const commandPaletteRef = useRef<HTMLDivElement>(null);
  const commandButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!commandPaletteRef.current?.contains(target) && !commandButtonRef.current?.contains(target)) {
        setShowCommandPalette(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function updateValue(next: string) {
    setValue(next);
    // Escribir "/" al principio abre los comandos y va marcando el que coincide.
    const typingCommand = next.startsWith("/") && !next.includes(" ");
    setShowCommandPalette(typingCommand);
    if (typingCommand) setActiveSuggestion(DIRECTOR_COMMANDS.findIndex((command) => command.prefix.startsWith(next)));
  }

  function selectCommand(index: number) {
    updateValue(`${DIRECTOR_COMMANDS[index].prefix} `);
    setShowCommandPalette(false);
    textareaRef.current?.focus();
  }

  function send() {
    const text = value.trim();
    if (!text || busy) return;
    onSend(text);
    setValue("");
    adjustHeight(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (showCommandPalette) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveSuggestion((previous) => (previous < DIRECTOR_COMMANDS.length - 1 ? previous + 1 : 0));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveSuggestion((previous) => (previous > 0 ? previous - 1 : DIRECTOR_COMMANDS.length - 1));
      } else if ((event.key === "Tab" || event.key === "Enter") && activeSuggestion >= 0) {
        event.preventDefault();
        selectCommand(activeSuggestion);
      } else if (event.key === "Escape") {
        event.preventDefault();
        setShowCommandPalette(false);
      }
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  }

  return (
    <div className="w-full space-y-4">
      <motion.div
        className="relative rounded-2xl border border-ink/[0.06] bg-paper/70 shadow-2xl shadow-ink/[0.06] backdrop-blur-2xl"
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="p-4 pb-2">
          <label htmlFor="director-input" className="sr-only">Mensaje para el Director</label>
          <textarea
            id="director-input"
            ref={textareaRef}
            value={value}
            onChange={(event) => {
              updateValue(event.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Preguntale al Director…"
            className="min-h-[60px] w-full resize-none overflow-hidden bg-transparent px-1 py-1 text-[15px] leading-6 text-ink outline-none placeholder:text-muted"
          />
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-ink/[0.05] p-4">
          {/* El menú sale del botón, flotando, en lugar de ocupar todo el ancho de la caja. */}
          <div className="relative">
            <motion.button
              ref={commandButtonRef}
              type="button"
              onClick={() => setShowCommandPalette((previous) => !previous)}
              whileTap={{ scale: 0.94 }}
              aria-label="Ver comandos"
              className={`group relative rounded-lg p-2 text-ink/40 transition-colors hover:text-ink/90 ${showCommandPalette ? "bg-ink/[0.06] text-ink/90" : ""}`}
            >
              <Command className="size-4" strokeWidth={1.7} />
              <motion.span
                className="absolute inset-0 rounded-lg bg-ink/[0.05] opacity-0 transition-opacity group-hover:opacity-100"
                layoutId="button-highlight"
              />
            </motion.button>
            <AnimatePresence>
              {showCommandPalette ? (
                <motion.div
                  ref={commandPaletteRef}
                  className="absolute bottom-full left-0 z-50 mb-2 w-80 overflow-hidden rounded-xl border border-mist bg-paper/95 p-1 shadow-[0_12px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                >
                  <div role="listbox" aria-label="Comandos del Director">
                    {DIRECTOR_COMMANDS.map((command, index) => (
                      <motion.button
                        type="button"
                        role="option"
                        aria-selected={activeSuggestion === index}
                        key={command.prefix}
                        className={`flex w-full cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                          activeSuggestion === index ? "bg-canvas" : "hover:bg-canvas/70"
                        }`}
                        onClick={() => selectCommand(index)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <span className="mt-0.5 flex size-5 items-center justify-center text-graphite">{command.icon}</span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 text-[13px]">
                            <span className="font-medium text-ink">{command.label}</span>
                            <span className="text-muted">{command.prefix}</span>
                          </span>
                          <span className="block text-[12px] text-graphite">{command.description}</span>
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-support hidden text-[11px] text-muted sm:inline">{creditsLabel}</span>
            {/* Apagado sin texto; negro con la flecha blanca cuando hay algo para mandar. */}
            <motion.button
              type="button"
              onClick={send}
              whileTap={{ scale: 0.94 }}
              disabled={busy || !value.trim()}
              aria-label="Enviar"
              className={`grid size-9 place-items-center rounded-full text-paper transition-colors ${
                value.trim() && !busy ? "bg-ink hover:bg-ink/85" : "bg-ink/15"
              }`}
            >
              {busy ? (
                <LoaderIcon className="size-4 animate-[spin_2s_linear_infinite]" strokeWidth={2} />
              ) : (
                <ArrowUp className="size-[18px]" strokeWidth={2.2} />
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {showSuggestions ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {DIRECTOR_COMMANDS.map((command, index) => (
            <motion.button
              type="button"
              key={command.prefix}
              onClick={() => selectCommand(index)}
              className="group relative flex items-center gap-2 rounded-lg bg-ink/[0.02] px-3 py-2 text-sm text-ink/60 transition-all hover:bg-ink/[0.05] hover:text-ink/90"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {command.icon}
              <span>{command.label}</span>
              <motion.span
                className="absolute inset-0 rounded-lg border border-ink/[0.05]"
                initial={false}
                animate={{ opacity: [0, 1], scale: [0.98, 1] }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </motion.button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Mientras el Director piensa: va en el lugar donde aparece la respuesta, como en ChatGPT. */
export function ThinkingIndicator() {
  return (
    <motion.div
      className="flex items-center gap-2.5 px-1 py-2"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      role="status"
    >
      <motion.span
        className="size-2.5 rounded-full bg-ink"
        animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="text-[14px] text-graphite"
        animate={{ opacity: [0.45, 1, 0.45] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        Pensando…
      </motion.span>
    </motion.div>
  );
}
