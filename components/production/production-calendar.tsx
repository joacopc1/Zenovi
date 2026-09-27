"use client";

import { startTransition, useOptimistic, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { rescheduleContentItem } from "@/app/(dashboard)/production/actions";
import {
  CONTENT_PIPELINE,
  FORMAT_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  contentItemName,
} from "@/lib/production/content";
import type { ContentItem } from "@/lib/data/production";
import {
  CALENDAR_WEEKDAYS,
  buildMonthGrid,
  calendarDateOf,
  type CalendarCell,
  isoDateOf,
  monthTitle,
  todayISODate,
} from "@/lib/production/calendar";
import type { PublishedPiece } from "@/lib/production/reconcile";

/**
 * El calendario de producción: lo que viene y lo que ya salió, en la misma grilla.
 *
 * Muestra las publicaciones reales de Instagram y no sólo las piezas del tablero, porque
 * si no contestaba mal la pregunta más obvia que se le hace a un calendario —"¿qué subí
 * y cuándo?"—: lo que el creador publicó sin anotarlo en Zenovi simplemente no existía.
 * Las que sí están en el tablero se ubican por el día en que salieron, no por el día en
 * que se habían planificado.
 */
export function ProductionCalendar({
  items,
  published,
  claimed,
  onOpen,
  onCreateOn,
}: {
  items: ContentItem[];
  published: PublishedPiece[];
  /** Publicaciones que ya tiene alguna pieza del tablero, filtrada o no. */
  claimed: ReadonlySet<string>;
  onOpen: (id: string) => void;
  /** Cargar una pieza nueva ya fechada en el día que se tocó. */
  onCreateOn: (date: string) => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [dragging, setDragging] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // La pieza aparece en su día nuevo mientras el servidor confirma; si falla, React
  // descarta el estado optimista y vuelve sola a donde estaba.
  const [board, moveOptimistically] = useOptimistic(
    items,
    (current: ContentItem[], move: { id: string; date: string }) =>
      current.map((item) => (item.id === move.id ? { ...item, targetDate: move.date } : item)),
  );
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // dnd-kit numera sus `aria-describedby` con un contador global que difiere entre
  // servidor y cliente. La grilla se dibuja igual; lo único que espera es el arrastre.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const days = buildMonthGrid(year, month);
  const itemsByDate = new Map<string, ContentItem[]>();

  for (const item of board) {
    const date = calendarDateOf(item);
    if (!date) continue;
    const list = itemsByDate.get(date) ?? [];
    list.push(item);
    itemsByDate.set(date, list);
  }

  // Las publicaciones que ya reclamó una pieza del tablero no se repiten: esa pieza ya
  // está en la grilla, con su nombre y su estado, que dice más que la publicación suelta.
  const publishedByDate = new Map<string, PublishedPiece[]>();

  for (const piece of published) {
    if (claimed.has(piece.id)) continue;
    const date = isoDateOf(new Date(piece.postedAt));
    const list = publishedByDate.get(date) ?? [];
    list.push(piece);
    publishedByDate.set(date, list);
  }

  function shift(delta: number) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  const todayKey = todayISODate();
  const draggedItem = board.find((item) => item.id === dragging) ?? null;

  function handleDragEnd(event: DragEndEvent) {
    setDragging(null);
    const id = String(event.active.id);
    const date = typeof event.over?.id === "string" ? event.over.id : null;
    const item = board.find((current) => current.id === id);

    if (date === null || !item || item.targetDate === date) return;

    startTransition(async () => {
      setError(null);
      moveOptimistically({ id, date });
      const result = await rescheduleContentItem({ status: "idle" }, { id, targetDate: date });
      if (result.status === "error") setError(result.message ?? "No pudimos cambiar la fecha.");
    });
  }

  const grid = (
    <div className="overflow-hidden rounded-card border border-mist">
      <header className="flex items-center justify-between border-b border-mist px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">{monthTitle(year, month)}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shift(-1)}
            className="grid size-7 place-items-center rounded-control text-graphite transition-colors hover:text-ink"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={15} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              setYear(now.getFullYear());
              setMonth(now.getMonth());
            }}
            className="h-7 rounded-control px-2.5 text-[12px] font-medium text-graphite transition-colors hover:text-ink"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            className="grid size-7 place-items-center rounded-control text-graphite transition-colors hover:text-ink"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={15} strokeWidth={1.75} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 border-b border-mist">
        {CALENDAR_WEEKDAYS.map((day) => (
          <div key={day} className="py-2 text-center text-[11px] font-medium text-muted">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 border-b border-mist">
        {days.map((cell) => (
          <Day
            key={cell.iso}
            cell={cell}
            isToday={cell.iso === todayKey}
            items={itemsByDate.get(cell.iso) ?? []}
            published={publishedByDate.get(cell.iso) ?? []}
            draggable={mounted}
            onOpen={onOpen}
            onCreate={() => onCreateOn(cell.iso)}
          />
        ))}
      </div>

      {error ? (
        <p role="alert" className="border-b border-mist px-4 py-2 text-[12px] text-danger">
          {error}
        </p>
      ) : null}

      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 py-2.5">
        {CONTENT_PIPELINE.map((status) => (
          <li key={status} className="flex items-center gap-1.5">
            {/* Con punto y no con el chip entero: la referencia explica los colores de la
                grilla, y si se pinta igual que ella termina llamando más la atención que
                lo que tiene que explicar. */}
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[status] }}
            />
            <span className="font-support text-[11px] text-muted">{STATUS_LABELS[status]}</span>
          </li>
        ))}
        {published.length > 0 ? (
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full border border-muted"
            />
            <span className="font-support text-[11px] text-muted">Publicado, sin registrar</span>
          </li>
        ) : null}
      </ul>
    </div>
  );

  if (!mounted) return grid;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event) => setDragging(String(event.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      {grid}
      <DragOverlay>
        {draggedItem ? (
          <span className="flex items-center gap-1.5 rounded-control border border-mist-strong bg-paper px-2 py-1 text-[11px] font-medium text-ink shadow-lg shadow-ink/5">
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[draggedItem.status] }}
            />
            {contentItemName(draggedItem)}
          </span>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/** Cuántas piezas entran en un día antes de resumir: más alto, la grilla se deforma. */
const MAX_PER_DAY = 3;

/**
 * Un día de la grilla.
 *
 * Es destino de arrastre y también botón: tocar el espacio vacío carga una pieza nueva ya
 * fechada ahí, que es lo que uno espera de un calendario y evita abrir el formulario para
 * después elegir la fecha a mano.
 */
function Day({
  cell,
  isToday,
  items,
  published,
  draggable,
  onOpen,
  onCreate,
}: {
  cell: CalendarCell;
  isToday: boolean;
  items: ContentItem[];
  published: PublishedPiece[];
  draggable: boolean;
  onOpen: (id: string) => void;
  onCreate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { setNodeRef, isOver } = useDroppable({ id: cell.iso, disabled: !draggable });
  const total = items.length + published.length;
  const capped = !expanded && total > MAX_PER_DAY;
  const shown = capped ? items.slice(0, MAX_PER_DAY) : items;
  const shownPublished = capped ? published.slice(0, Math.max(0, MAX_PER_DAY - shown.length)) : published;

  return (
    <div
      ref={setNodeRef}
      className={`group relative min-h-[96px] border-b border-r border-mist p-1.5 transition-colors last:border-r-0 ${
        isOver ? "bg-canvas" : cell.inMonth ? "" : "bg-canvas/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`font-numeric inline-flex size-6 items-center justify-center rounded-full text-[12px] ${
            isToday ? "bg-ink font-semibold text-paper" : cell.inMonth ? "text-ink" : "text-muted"
          }`}
        >
          {cell.day}
        </span>
        <button
          type="button"
          onClick={onCreate}
          aria-label={`Cargar una pieza el ${cell.day}`}
          className="grid size-5 place-items-center rounded-control text-muted opacity-0 transition-opacity hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Plus size={13} strokeWidth={1.75} />
        </button>
      </div>

      <div className="mt-1 space-y-1">
        {shown.map((item) => (
          <DayItem key={item.id} item={item} draggable={draggable} onOpen={onOpen} />
        ))}

        {shownPublished.map((piece) => (
          <span
            key={piece.id}
            title={`${FORMAT_LABELS[piece.kind]} publicado, sin registrar en el tablero`}
            className="flex w-full items-center gap-1.5 rounded-control border border-dashed border-mist px-2 py-1 text-left text-[11px] font-medium text-muted"
          >
            <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full border border-muted" />
            <span className="truncate">{FORMAT_LABELS[piece.kind]}</span>
          </span>
        ))}

        {capped ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="w-full px-2 text-left text-[11px] font-medium text-graphite transition-colors hover:text-ink"
          >
            +{total - shown.length - shownPublished.length} más
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Una pieza dentro de un día.
 *
 * Se arrastra para cambiarle la fecha, salvo si ya se publicó: el lugar de una pieza
 * publicada es el día en que salió de verdad, y eso no se decide arrastrando.
 */
function DayItem({
  item,
  draggable,
  onOpen,
}: {
  item: ContentItem;
  draggable: boolean;
  onOpen: (id: string) => void;
}) {
  const published = item.status === "publicada";
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    disabled: !draggable || published,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(item.id)}
      title={`${contentItemName(item)} · ${STATUS_LABELS[item.status]}`}
      style={published ? undefined : { backgroundColor: STATUS_COLORS[item.status] }}
      className={`flex w-full items-center rounded-control px-2 py-1 text-left text-[11px] font-medium transition-opacity ${
        // Lo publicado ya salió: se lee en contorno, no compite con lo que falta hacer.
        published
          ? "cursor-pointer border border-dashed border-mist-strong text-muted hover:bg-canvas"
          : "text-paper hover:opacity-85"
      } ${isDragging ? "opacity-0" : ""} ${
        draggable && !published ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <span className="truncate">{contentItemName(item)}</span>
    </div>
  );
}
