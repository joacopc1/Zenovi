"use client";

import { useState } from "react";
import { CalendarDays, Columns3, Plus } from "lucide-react";
import type { ContentItem } from "@/lib/data/production";
import { buildProductionBoard } from "@/lib/production/board";
import type { PublishedPiece } from "@/lib/production/reconcile";
import { CadenceSignal } from "./cadence-signal";
import { ContentTypeFilter } from "./content-type-filter";
import { ProductionSearch } from "./production-search";
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
  const [createDate, setCreateDate] = useState<string | null>(null);
  const [openEditing, setOpenEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const openItem = items.find((item) => item.id === openId) ?? null;
  const board = buildProductionBoard({ items, published, requestedType: selectedType, query });

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

        <div className="mb-2 flex items-center gap-4">
          {items.length > 0 ? (
            <>
              <ProductionSearch
                query={query}
                matches={board.matches}
                links={links}
                onQueryChange={setQuery}
                onOpen={setOpenId}
              />
              <span aria-hidden="true" className="h-7 w-px bg-mist" />
            </>
          ) : null}
          <button
            type="button"
            onClick={() => setCreateGuion(false)}
            className="inline-flex h-9 items-center gap-1.5 rounded-control bg-ink px-4 text-sm font-semibold text-paper transition-opacity hover:opacity-90"
          >
            <Plus size={15} strokeWidth={1.75} aria-hidden="true" />
            Nueva idea
          </button>
        </div>
      </div>

      {items.length > 0 ? (
        <ContentTypeFilter
          items={items}
          active={board.activeType}
          onChange={setSelectedType}
          className="mt-4"
        />
      ) : null}

      <div className="mt-6">
        {view === "pipeline" ? (
          <ProductionPipeline
            items={board.columns}
            links={links}
            openId={openId}
            onOpen={(id) => {
              setOpenEditing(false);
              setOpenId(id);
            }}
            onEdit={(id) => {
              setOpenEditing(true);
              setOpenId(id);
            }}
            onCreate={(guion) => setCreateGuion(guion)}
          />
        ) : (
          <ProductionCalendar
            items={board.visible}
            published={published}
            claimed={board.claimedMedia}
            onOpen={setOpenId}
            onCreateOn={(date) => {
              setCreateDate(date);
              setCreateGuion(false);
            }}
          />
        )}
      </div>

      {view === "calendar" ? (
        <CadenceSignal reading={board.cadence} instagramConnected={instagramConnected} />
      ) : (
        <>
          <UnregisteredPublications publications={board.unregistered} items={items} />
          <ProductionHistory items={board.history} links={links} onOpen={setOpenId} />
        </>
      )}

      {openItem ? (
        <ProductionDetail
          item={openItem}
          candidates={links.candidates[openItem.id] ?? []}
          performance={links.performance[openItem.id] ?? null}
          contentTypes={board.typeSuggestions}
          startEditing={openEditing}
          onClose={() => {
            setOpenEditing(false);
            setOpenId(null);
          }}
        />
      ) : null}

      {createGuion !== null ? (
        <NewContentItemDialog
          initialGuion={createGuion}
          initialDate={createDate}
          contentTypes={board.typeSuggestions}
          onClose={() => {
            setCreateGuion(null);
            setCreateDate(null);
          }}
        />
      ) : null}
    </div>
  );
}
