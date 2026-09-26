"use client";

import { startTransition, useOptimistic, useState, useSyncExternalStore } from "react";
import { Calendar, Link2, Plus, Bot } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { moveContentItemToStatus } from "@/app/(dashboard)/production/actions";
import {
  CONTENT_PIPELINE,
  FORMAT_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  formatTargetDate,
  resolveDropStatus,
  type ContentStatus,
  contentItemName,
  shortReference,
} from "@/lib/production/content";
import type { ContentItem } from "@/lib/data/production";
import type { ProductionLinks, PublishedPerformance } from "@/lib/data/production-links";
import { PerformanceBadge } from "@/components/content/performance-badge";

/** Arrastrar empieza después de 6px: un click corto sigue abriendo la pieza. */
const DRAG_THRESHOLD_PX = 6;

/**
 * La zona donde se sueltan las piezas mide siempre lo mismo, tenga una tarjeta o veinte.
 *
 * El mínimo existe porque una columna vacía que midiera su contenido quedaría en una
 * franja de pocos píxeles a la que habría que apuntarle. El máximo, porque una columna
 * con veinte ideas estiraría la página entera y dejaría a las otras tres en el aire: a
 * partir de ahí la columna hace scroll por dentro y el tablero no se mueve.
 */
const DROP_AREA = "min-h-[26rem] max-h-[34rem] overflow-y-auto";

export function ProductionPipeline({
  items,
  links,
  openId,
  onOpen,
  onCreate,
}: {
  items: ContentItem[];
  links: ProductionLinks;
  openId: string | null;
  onOpen: (id: string | null) => void;
  onCreate: (guion: boolean) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<ContentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  // La tarjeta se muestra en su columna nueva mientras el servidor confirma. Si falla,
  // React descarta el estado optimista y la tarjeta vuelve sola, con el aviso al lado.
  const [board, moveOptimistically] = useOptimistic(
    items,
    (current: ContentItem[], move: { id: string; status: ContentStatus }) =>
      current.map((item) => (item.id === move.id ? { ...item, status: move.status } : item)),
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: DRAG_THRESHOLD_PX } }),
  );

  // dnd-kit asigna un aria-describedby con un contador global que difiere entre servidor
  // y cliente, causando un hydration mismatch. El tablero se dibuja igual en los dos
  // casos; lo único que espera a la hidratación es el arrastre.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const activeItem = board.find((item) => item.id === activeId) ?? null;

  function handleDragEnd(event: DragEndEvent) {
    const id = String(event.active.id);
    setActiveId(null);
    setOverStatus(null);

    const status = resolveDropStatus(event.over?.id, event.over?.data.current);
    const item = board.find((current) => current.id === id);
    if (status === null || !item || item.status === status) return;

    startTransition(async () => {
      setError(null);
      moveOptimistically({ id, status });
      const result = await moveContentItemToStatus({ status: "idle" }, { id, status });
      if (result.status === "error") {
        setError(result.message ?? "No pudimos mover la pieza.");
      }
    });
  }

  const boardView = (
    <Board
      items={board}
      links={links}
      draggable={mounted}
      overStatus={overStatus}
      openId={openId}
      onOpen={onOpen}
      onCreate={onCreate}
    />
  );

  return (
    <>
      {error ? (
        <p role="status" className="font-support mb-3 text-[13px] text-danger">
          {error}
        </p>
      ) : null}

      {mounted ? (
        <DndContext
          sensors={sensors}
          onDragStart={(event: DragStartEvent) => setActiveId(String(event.active.id))}
          onDragOver={(event) =>
            setOverStatus(resolveDropStatus(event.over?.id, event.over?.data.current))
          }
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            setActiveId(null);
            setOverStatus(null);
          }}
        >
          {boardView}
          <DragOverlay>{activeItem ? <CardGhost item={activeItem} /> : null}</DragOverlay>
        </DndContext>
      ) : (
        boardView
      )}
    </>
  );
}

function Board({
  items,
  links,
  draggable,
  overStatus,
  openId,
  onOpen,
  onCreate,
}: {
  items: ContentItem[];
  links: ProductionLinks;
  draggable: boolean;
  overStatus: ContentStatus | null;
  openId: string | null;
  onOpen: (id: string | null) => void;
  onCreate: (guion: boolean) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {CONTENT_PIPELINE.map((status) => (
        <Column
          key={status}
          status={status}
          items={items.filter((item) => item.status === status)}
          links={links}
          draggable={draggable}
          isOver={overStatus === status}
          openId={openId}
          onOpen={onOpen}
          onCreate={onCreate}
        />
      ))}
    </div>
  );
}

function Column({
  status,
  items,
  links,
  draggable,
  isOver,
  openId,
  onOpen,
  onCreate,
}: {
  status: ContentStatus;
  items: ContentItem[];
  links: ProductionLinks;
  draggable: boolean;
  isOver: boolean;
  openId: string | null;
  onOpen: (id: string | null) => void;
  onCreate: (guion: boolean) => void;
}) {
  // Sólo las columnas reciben la tarjeta. Si las tarjetas también fueran destino, dnd-kit
  // elegiría la de abajo —gana por proporción de superposición— en lugar de la columna.
  const { setNodeRef } = useDroppable({ id: status, disabled: !draggable });

  return (
    <div
      ref={setNodeRef}
      data-status={status}
      className={`flex flex-col rounded-card border bg-paper p-3 transition-colors ${
        isOver ? "border-mist-strong bg-canvas/60" : "border-mist"
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: STATUS_COLORS[status] }}
        />
        <h3 className="text-[13px] font-semibold text-ink">{STATUS_LABELS[status]}</h3>
        <span className="font-numeric grid size-4 shrink-0 place-items-center rounded-full bg-canvas text-[10px] text-ink">
          {items.length}
        </span>
        {status === "idea" || status === "guion" ? (
          <button
            type="button"
            onClick={() => onCreate(status === "guion")}
            className="ml-auto grid size-6 shrink-0 place-items-center rounded-control text-graphite transition-colors hover:text-ink"
            aria-label={`Agregar pieza a ${STATUS_LABELS[status]}`}
          >
            <Plus size={15} strokeWidth={1.75} />
          </button>
        ) : null}
      </div>

      <div className={`flex flex-1 flex-col gap-2 ${DROP_AREA}`}>
        {items.map((item) => (
          <Card
            key={item.id}
            item={item}
            performance={links.performance[item.id] ?? null}
            status={status}
            draggable={draggable}
            selected={openId === item.id}
            onOpen={() => onOpen(openId === item.id ? null : item.id)}
          />
        ))}
        {items.length === 0 ? (
          <div className="grid flex-1 place-items-center rounded-card border border-dashed border-mist px-3 py-4 text-center text-[12px] text-muted">
            Sin piezas
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Card({
  item,
  performance,
  status,
  draggable,
  selected,
  onOpen,
}: {
  item: ContentItem;
  performance: PublishedPerformance | null;
  status: ContentStatus;
  draggable: boolean;
  selected: boolean;
  onOpen: () => void;
}) {
  // La tarjeta lleva su columna encima: es lo que permite resolver el destino cuando se
  // suelta sobre otra tarjeta.
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: { status },
    disabled: !draggable,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      className={`rounded-card border bg-paper p-3 transition-opacity ${
        selected ? "border-mist-strong" : "border-mist"
      } ${isDragging ? "opacity-0" : ""} ${draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
    >
      <CardBody item={item} performance={performance} />
    </div>
  );
}

function CardGhost({ item }: { item: ContentItem }) {
  return (
    <div className="cursor-grabbing rounded-card border border-mist bg-canvas p-3">
      <CardBody item={item} performance={null} />
    </div>
  );
}

function CardBody({
  item,
  performance,
}: {
  item: ContentItem;
  performance: PublishedPerformance | null;
}) {
  const snippet = item.cta || item.development || item.hook;

  return (
    <>
      <p className="text-[13px] font-semibold leading-5 text-ink">{contentItemName(item)}</p>

      {snippet ? (
        <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-5 text-muted">{snippet}</p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge>{FORMAT_LABELS[item.format]}</Badge>
        {item.contentType ? <Badge>{item.contentType}</Badge> : null}
        {performance ? <PerformanceBadge multiplier={performance.multiplier} /> : null}
      </div>

      <div className="mt-2.5 flex items-center gap-3 border-t border-mist pt-2.5 text-muted">
        {item.referenceUrl ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <Link2 size={13} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
            <span className="truncate text-[12px]">{shortReference(item.referenceUrl)}</span>
          </span>
        ) : null}
        <span className="flex shrink-0 items-center gap-1.5">
          <Calendar size={13} strokeWidth={1.75} aria-hidden="true" />
          <span className="font-numeric text-[12px]">
            {item.targetDate ? formatTargetDate(item.targetDate, "short") : "—"}
          </span>
        </span>
        {item.source === "director" ? (
          <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-control border border-mist px-2 py-1 text-[11px] font-medium text-graphite">
            <Bot size={13} strokeWidth={1.75} aria-hidden="true" />
            Director IA
          </span>
        ) : null}
      </div>
    </>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-graphite">
      {children}
    </span>
  );
}
