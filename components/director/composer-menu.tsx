"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { ChevronLeft, LayoutGrid, LoaderIcon, Paperclip, Plus, Search } from "lucide-react";
import { listDirectorPieces, type DirectorPieceOption } from "@/app/(dashboard)/director/actions";

export type DirectorCommand = { icon: ReactNode; label: string; description: string; prefix: string };

/**
 * El "+" de la caja, como en ChatGPT: adjuntar una pieza de la cuenta, archivos (más
 * adelante) y los comandos. Escribir "/" al principio también lo abre en los comandos.
 */
export function ComposerMenu({
  open,
  onOpenChange,
  commands,
  activeCommand,
  onCommand,
  onPiece,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: DirectorCommand[];
  /** El comando que coincide con lo que se está escribiendo después de "/". */
  activeCommand: number;
  onCommand: (index: number) => void;
  onPiece: (piece: DirectorPieceOption) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"main" | "pieces">("main");

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) onOpenChange(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open, onOpenChange]);

  return (
    <div ref={ref} className="relative shrink-0">
      <motion.button
        type="button"
        onClick={() => {
          setView("main");
          onOpenChange(!open);
        }}
        whileTap={{ scale: 0.94 }}
        aria-label="Agregar"
        aria-expanded={open}
        className={`grid size-9 place-items-center rounded-full text-ink/60 transition-colors hover:bg-ink/[0.05] hover:text-ink ${open ? "bg-ink/[0.06] text-ink" : ""}`}
      >
        <Plus className="size-[18px]" strokeWidth={1.8} />
      </motion.button>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="absolute bottom-full left-0 z-50 mb-2 w-80 overflow-hidden rounded-xl border border-mist bg-paper/95 p-1 shadow-[0_12px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
          >
            {view === "pieces" ? (
              <PiecePicker
                onBack={() => setView("main")}
                onPick={(piece) => {
                  onPiece(piece);
                  onOpenChange(false);
                }}
              />
            ) : (
              <div role="menu">
                <MenuRow icon={<LayoutGrid className="size-4" strokeWidth={1.7} />} label="Elegir una pieza" description="Un Reel, Post o Historia para que el Director lo mire" onClick={() => setView("pieces")} />
                <MenuRow icon={<Paperclip className="size-4" strokeWidth={1.7} />} label="Adjuntar archivo" description="Próximamente" disabled />
                <div className="mx-2 my-1 border-t border-mist" />
                {commands.map((command, index) => (
                  <MenuRow
                    key={command.prefix}
                    icon={command.icon}
                    label={command.label}
                    hint={command.prefix}
                    description={command.description}
                    active={activeCommand === index}
                    onClick={() => onCommand(index)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MenuRow({
  icon,
  label,
  hint,
  description,
  active = false,
  disabled = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  description: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        active ? "bg-canvas" : "enabled:hover:bg-canvas/70"
      }`}
    >
      <span className="mt-0.5 flex size-5 items-center justify-center text-graphite">{icon}</span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-[13px]">
          <span className="font-medium text-ink">{label}</span>
          {hint ? <span className="text-muted">{hint}</span> : null}
        </span>
        <span className="block text-[12px] text-graphite">{description}</span>
      </span>
    </button>
  );
}

/** Las piezas recientes, con buscador por texto o por nombre ("Reel del 28"). */
function PiecePicker({ onBack, onPick }: { onBack: () => void; onPick: (piece: DirectorPieceOption) => void }) {
  const [pieces, setPieces] = useState<DirectorPieceOption[] | null>(null);
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => setPieces(await listDirectorPieces()));
  }, []);

  const needle = query.trim().toLocaleLowerCase("es");
  const visible = (pieces ?? []).filter(
    (piece) => !needle || `${piece.label} ${piece.caption ?? ""}`.toLocaleLowerCase("es").includes(needle),
  );

  return (
    <div>
      <div className="flex items-center gap-1 px-1 pb-1">
        <button type="button" onClick={onBack} aria-label="Volver" className="grid size-7 place-items-center rounded-lg text-graphite hover:bg-canvas hover:text-ink">
          <ChevronLeft className="size-4" strokeWidth={1.8} />
        </button>
        <label className="flex flex-1 items-center gap-1.5 rounded-lg bg-canvas px-2 py-1.5">
          <Search className="size-3.5 text-muted" strokeWidth={1.8} />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por texto o fecha"
            aria-label="Buscar una pieza"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
          />
        </label>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {pieces === null ? (
          <p className="flex items-center gap-2 px-3 py-3 text-[12px] text-muted">
            <LoaderIcon className="size-3.5 animate-spin" strokeWidth={1.8} /> Cargando tus piezas…
          </p>
        ) : visible.length === 0 ? (
          <p className="px-3 py-3 text-[12px] text-muted">No encontré piezas con eso.</p>
        ) : (
          visible.map((piece) => (
            <button
              key={piece.id}
              type="button"
              onClick={() => onPick(piece)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-canvas/70"
            >
              <span className="relative h-11 w-8 shrink-0 overflow-hidden rounded-md bg-canvas">
                {piece.thumbnailUrl ? <Image src={piece.thumbnailUrl} alt="" fill sizes="32px" className="object-cover" /> : null}
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-ink">{piece.label}</span>
                {piece.caption ? <span className="block truncate text-[12px] text-graphite">{piece.caption}</span> : null}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
