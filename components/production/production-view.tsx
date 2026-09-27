"use client";

import { useState } from "react";
import { CalendarDays, Columns3, Plus } from "lucide-react";
import type { ContentItem } from "@/lib/data/production";
import {
  collectContentTypes,
  contentTypeSuggestions,
  matchesContentType,
  splitRecentlyPublished,
} from "@/lib/production/content";
import { readCadence } from "@/lib/production/cadence";
import { unregisteredPublications, type PublishedPiece } from "@/lib/production/reconcile";
import { CadenceSignal } from "./cadence-signal";
import { ContentTypeFilter } from "./content-type-filter";
import { UnregisteredPublications } from "./unregistered-publications";
import type { ProductionLinks } from "@/lib/data/production-links";
import { ProductionPipeline } from "./production-pipeline";
import { ProductionCalendar } from "./production-calendar";
import { ProductionDetail } from "./production-detail";
import { NewContentItemDialog } from "./new-content-item";
import { ProductionHistory } from "./production-history";

export function ProductionView({
  items,
  links,
  published,
  instagramConnected,
}: {
  items: ContentItem[];
  links: ProductionLinks;
  published: PublishedPiece[];
  instagramConnected: boolean;
}) {
  const [view, setView] = useState<"pipeline" | "calendar">("pipeline");
  const [openId, setOpenId] = useState<string | null>(null);
  const [createGuion, setCreateGuion] = useState<boolean | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const openItem = items.find((item) => item.id === openId) ?? null;

  // El tablero se queda con lo que está en curso y con lo que salió hace poco; lo viejo
  // baja al historial. El calendario sigue recibiendo todo: ahí la fecha es el eje.
  const { recent, older } = splitRecentlyPublished(
    items.filter((item) => item.status === "publicada"),
  );
  const ownTypes = collectContentTypes(items).map((entry) => entry.value);
  const contentTypes = contentTypeSuggestions(ownTypes);
  // Derivado y no guardado: si el tipo filtrado deja de existir —se borró la última pieza
  // que lo usaba, o se le cambió el nombre—, los chips desaparecen y el filtro tiene que
  // soltarse solo. Guardándolo en el estado, el tablero quedaba vacío sin nada que tocar.
  const type = ownTypes.some((own) => matchesContentType({ contentType: own }, selectedType ?? ""))
    ? selectedType
    : null;

  // El filtro cambia el tablero y el calendario, no el semáforo ni el historial: el ritmo
  // de publicación y lo que ya salió son de la cuenta entera, no de una categoría.
  const shown = type === null ? items : items.filter((item) => matchesContentType(item, type));
  const recentIds = new Set(recent.map((item) => item.id));
  // Sobre todas las piezas, no sobre las que el filtro deja ver: una publicación ya
  // registrada sigue estándolo aunque su pieza esté escondida.
  const claimedMediaIds = new Set(
    items.map((item) => item.linkedMediaId).filter((id): id is string => id !== null),
  );
  const boardItems = shown.filter(
    (item) => item.status !== "publicada" || recentIds.has(item.id),
  );
  const cadence = readCadence(
    items,
    published.map((piece) => piece.postedAt),
    new Date(),
  );
  const unregistered = unregisteredPublications(published, items);

  return (
    <div className="mt-6">
      <div className="flex items-end justify-between gap-4 border-b border-mist">
        <nav className="-mb-px flex gap-6" aria-label="Vistas de producción">
          <button
            type="button"
            onClick={() => setView("pipeline")}
            aria-current={view === "pipeline" ? "page" : undefined}
            className={`flex items-center gap-1.5 border-b-2 pb-2.5 text-[13px] font-medium transition-colors ${
              view === "pipeline" ? "border-ink text-ink" : "border-transparent text-graphite hover:text-ink"
            }`}
          >
            <Columns3 size={15} strokeWidth={1.75} aria-hidden="true" />
            Pipeline
          </button>
          <button
            type="button"
            onClick={() => setView("calendar")}
            aria-current={view === "calendar" ? "page" : undefined}
            className={`flex items-center gap-1.5 border-b-2 pb-2.5 text-[13px] font-medium transition-colors ${
              view === "calendar" ? "border-ink text-ink" : "border-transparent text-graphite hover:text-ink"
            }`}
          >
            <CalendarDays size={15} strokeWidth={1.75} aria-hidden="true" />
            Calendario
          </button>
        </nav>

        <button
          type="button"
          onClick={() => setCreateGuion(false)}
          className="mb-2 inline-flex h-9 items-center gap-1.5 rounded-control bg-ink px-4 text-sm font-semibold text-paper transition-opacity hover:opacity-90"
        >
          <Plus size={15} strokeWidth={1.75} aria-hidden="true" />
          Nueva idea
        </button>
      </div>

      {items.length > 0 ? (
        <ContentTypeFilter items={items} active={type} onChange={setSelectedType} />
      ) : null}

      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyBoard onCreate={() => setCreateGuion(false)} />
        ) : view === "pipeline" ? (
          <ProductionPipeline
            items={boardItems}
            links={links}
            openId={openId}
            onOpen={setOpenId}
            onCreate={(guion) => setCreateGuion(guion)}
          />
        ) : (
          <ProductionCalendar
            items={shown}
            published={published}
            claimed={claimedMediaIds}
            onOpen={setOpenId}
          />
        )}
      </div>

      {items.length === 0 ? null : view === "calendar" ? (
        <CadenceSignal reading={cadence} instagramConnected={instagramConnected} />
      ) : (
        <>
          <UnregisteredPublications publications={unregistered} items={items} />
          <ProductionHistory items={older} links={links} onOpen={setOpenId} />
        </>
      )}

      {openItem ? (
        <ProductionDetail
          item={openItem}
          candidates={links.candidates[openItem.id] ?? []}
          performance={links.performance[openItem.id] ?? null}
          contentTypes={contentTypes}
          onClose={() => setOpenId(null)}
        />
      ) : null}

      {createGuion !== null ? (
        <NewContentItemDialog
          initialGuion={createGuion}
          contentTypes={contentTypes}
          onClose={() => setCreateGuion(null)}
        />
      ) : null}
    </div>
  );
}

/**
 * Lo primero que ve alguien que nunca cargó una pieza.
 *
 * Cuatro columnas vacías no explican nada: dicen que falta algo pero no qué hace la
 * sección ni por dónde se empieza. Acá se cuenta el recorrido entero en una frase, porque
 * lo que hace valiosa a Producción es el final —la pieza publicada se ata a su video y se
 * puede ver cómo rindió—, no el tablero en sí.
 */
function EmptyBoard({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="rounded-card border border-mist px-6 py-14 text-center">
      <h2 className="text-base font-semibold">Todavía no hay piezas en producción</h2>
      <p className="font-support mx-auto mt-2 max-w-lg text-sm leading-6 text-graphite">
        Una idea entra con un título o con el link de lo que te inspiró, y avanza hasta
        publicarse: guion, grabación y salida. Cuando la publicás, Zenovi la reconoce entre
        tus piezas de Instagram y te dice cómo rindió contra el resto de tu contenido.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-control bg-ink px-4 text-sm font-semibold text-paper transition-opacity hover:opacity-90"
      >
        <Plus size={15} strokeWidth={1.75} aria-hidden="true" />
        Cargar la primera idea
      </button>
    </section>
  );
}
