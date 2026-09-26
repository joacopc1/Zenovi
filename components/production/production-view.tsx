"use client";

import { useState } from "react";
import { CalendarDays, Columns3, Plus } from "lucide-react";
import type { ContentItem } from "@/lib/data/production";
import { splitRecentlyPublished } from "@/lib/production/content";
import { readCadence } from "@/lib/production/cadence";
import { CadenceSignal } from "./cadence-signal";
import type { ProductionLinks } from "@/lib/data/production-links";
import { ProductionPipeline } from "./production-pipeline";
import { ProductionCalendar } from "./production-calendar";
import { ProductionDetail } from "./production-detail";
import { NewContentItemDialog } from "./new-content-item";
import { ProductionHistory } from "./production-history";

export function ProductionView({
  items,
  links,
  postedAt,
}: {
  items: ContentItem[];
  links: ProductionLinks;
  postedAt: string[];
}) {
  const [view, setView] = useState<"pipeline" | "calendar">("pipeline");
  const [openId, setOpenId] = useState<string | null>(null);
  const [createGuion, setCreateGuion] = useState<boolean | null>(null);
  const openItem = items.find((item) => item.id === openId) ?? null;

  // El tablero se queda con lo que está en curso y con lo que salió hace poco; lo viejo
  // baja al historial. El calendario sigue recibiendo todo: ahí la fecha es el eje.
  const { recent, older } = splitRecentlyPublished(
    items.filter((item) => item.status === "publicada"),
  );
  const boardItems = items.filter((item) => item.status !== "publicada").concat(recent);
  const cadence = readCadence(items, postedAt, new Date());

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

      <div className="mt-6">
        {view === "pipeline" ? (
          <ProductionPipeline
            items={boardItems}
            links={links}
            openId={openId}
            onOpen={setOpenId}
            onCreate={(guion) => setCreateGuion(guion)}
          />
        ) : (
          <ProductionCalendar items={items} onOpen={setOpenId} />
        )}
      </div>

      {view === "pipeline" ? (
        <>
          <CadenceSignal reading={cadence} />
          <ProductionHistory items={older} links={links} onOpen={setOpenId} />
        </>
      ) : null}

      {openItem ? (
        <ProductionDetail
          item={openItem}
          candidates={links.candidates[openItem.id] ?? []}
          performance={links.performance[openItem.id] ?? null}
          onClose={() => setOpenId(null)}
        />
      ) : null}

      {createGuion !== null ? (
        <NewContentItemDialog
          initialGuion={createGuion}
          onClose={() => setCreateGuion(null)}
        />
      ) : null}
    </div>
  );
}
