"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { motion } from "motion/react";
import { ArrowUp, CalendarRange, FileText, Lightbulb, LoaderIcon, ScanSearch, X } from "lucide-react";
import type { DirectorPieceOption } from "@/app/(dashboard)/director/actions";
import { ComposerMenu, type DirectorCommand } from "./composer-menu";

/**
 * La caja para hablar con el Director. Parte del componente `animated-ai-chat` de la
 * colección de 21st.dev (comandos con "/", chips de sugerencia, "pensando"), en la paleta
 * clara de Zenovi y con la forma de una sola fila de ChatGPT: "+", texto y enviar.
 */

export const DIRECTOR_COMMANDS: DirectorCommand[] = [
  { icon: <Lightbulb className="size-4" strokeWidth={1.7} />, label: "Ideas", description: "Ideas de contenido para grabar", prefix: "/idea" },
  { icon: <FileText className="size-4" strokeWidth={1.7} />, label: "Guion", description: "Un guion listo para grabar", prefix: "/guion" },
  { icon: <ScanSearch className="size-4" strokeWidth={1.7} />, label: "Analizar", description: "Qué conservar, qué cambiar y qué probar", prefix: "/analizar" },
  { icon: <CalendarRange className="size-4" strokeWidth={1.7} />, label: "Plan", description: "Un plan de publicación para los próximos días", prefix: "/plan" },
];

/**
 * Arranca en un renglón y crece con el texto; al llegar al tope deja de crecer y hace
 * scroll, como la caja de ChatGPT.
 */
function useAutoResizeTextarea({ minHeight, maxHeight }: { minHeight: number; maxHeight: number }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.style.height = `${minHeight}px`;
      if (reset) {
        textarea.style.overflowY = "hidden";
        return;
      }
      textarea.style.height = `${Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight))}px`;
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
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
  /** El texto y, si se adjuntó, la pieza que el Director tiene que mirar. */
  onSend: (text: string, piece: DirectorPieceOption | null) => void;
  busy: boolean;
  /** "Te quedan 1.320 créditos": el uso también se ve donde se gasta. */
  creditsLabel: string;
  showSuggestions: boolean;
}) {
  const [value, setValue] = useState("");
  const [piece, setPiece] = useState<DirectorPieceOption | null>(null);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [menuOpen, setMenuOpen] = useState(false);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 24, maxHeight: 192 });

  function updateValue(next: string) {
    setValue(next);
    // Escribir "/" al principio abre el menú en los comandos y va marcando el que coincide.
    const typingCommand = next.startsWith("/") && !next.includes(" ");
    setMenuOpen(typingCommand);
    setActiveSuggestion(typingCommand ? DIRECTOR_COMMANDS.findIndex((command) => command.prefix.startsWith(next)) : -1);
  }

  function selectCommand(index: number) {
    updateValue(`${DIRECTOR_COMMANDS[index].prefix} `);
    setMenuOpen(false);
    textareaRef.current?.focus();
  }

  function send() {
    const text = value.trim();
    if ((!text && !piece) || busy) return;
    onSend(text, piece);
    setValue("");
    setPiece(null);
    adjustHeight(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (menuOpen) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveSuggestion((previous) => (previous < DIRECTOR_COMMANDS.length - 1 ? previous + 1 : 0));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveSuggestion((previous) => (previous > 0 ? previous - 1 : DIRECTOR_COMMANDS.length - 1));
        return;
      }
      if ((event.key === "Tab" || event.key === "Enter") && activeSuggestion >= 0) {
        event.preventDefault();
        selectCommand(activeSuggestion);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        return;
      }
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  }

  const canSend = (value.trim().length > 0 || piece !== null) && !busy;

  return (
    <div className="w-full space-y-3">
      <motion.div
        className="rounded-[26px] border border-ink/[0.08] bg-paper px-2.5 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        {piece ? (
          <div className="mb-1.5 ml-1.5 mt-0.5 inline-flex items-center gap-1.5 rounded-full border border-mist bg-canvas py-0.5 pl-2.5 pr-1 text-[12px] font-medium text-ink">
            {piece.label}
            <button type="button" onClick={() => setPiece(null)} aria-label={`Quitar ${piece.label}`} className="grid size-5 place-items-center rounded-full text-graphite hover:bg-ink/[0.06] hover:text-ink">
              <X className="size-3" strokeWidth={2} />
            </button>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <ComposerMenu
            open={menuOpen}
            onOpenChange={setMenuOpen}
            commands={DIRECTOR_COMMANDS}
            activeCommand={activeSuggestion}
            onCommand={selectCommand}
            onPiece={(picked) => {
              setPiece(picked);
              textareaRef.current?.focus();
            }}
          />
          <label htmlFor="director-input" className="sr-only">Mensaje para el Director</label>
          <textarea
            id="director-input"
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(event) => {
              updateValue(event.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder={piece ? "¿Qué querés saber de esta pieza?" : "Preguntale al Director…"}
            className="mb-1.5 min-w-0 flex-1 resize-none overflow-hidden bg-transparent px-1 text-[15px] leading-6 text-ink outline-none placeholder:text-muted"
          />
          {/* Apagado sin texto; negro con la flecha blanca cuando hay algo para mandar. */}
          <motion.button
            type="button"
            onClick={send}
            whileTap={{ scale: 0.94 }}
            disabled={!canSend}
            aria-label="Enviar"
            className={`grid size-9 shrink-0 place-items-center rounded-full text-paper transition-colors ${canSend ? "bg-ink hover:bg-ink/85" : "bg-ink/15"}`}
          >
            {busy ? (
              <LoaderIcon className="size-4 animate-[spin_2s_linear_infinite]" strokeWidth={2} />
            ) : (
              <ArrowUp className="size-[18px]" strokeWidth={2.2} />
            )}
          </motion.button>
        </div>
      </motion.div>
      <p className="text-center text-[11px] text-muted">{creditsLabel}</p>

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
export function ThinkingIndicator({ label = "Pensando…" }: { label?: string }) {
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
        {label}
      </motion.span>
    </motion.div>
  );
}
