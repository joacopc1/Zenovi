import Link from "next/link";
import type { RankedContentItem } from "@/lib/content/library";
import { captionPreview } from "@/lib/content/caption-display";
import { ContentThumbnail } from "./content-thumbnail";
import { EngagementSummary } from "./engagement-summary";
import { ExternalIcon } from "./metric-icons";
import { PerformanceBadge } from "./performance-badge";

export function ContentCard({ item, priority }: { item: RankedContentItem; priority?: boolean }) {
  const detailHref = `/content/${item.id}?type=${item.kind}`;

  return (
    <article className="group relative overflow-hidden rounded-card border border-mist bg-paper transition-colors hover:bg-ink/[0.035]">
      <Link href={detailHref} className="block" aria-label={`Abrir detalle de ${item.formatLabel} del ${item.dateLabel}`}>
        <div className="relative">
          <ContentThumbnail item={item} priority={priority} interactive />
          <div className="font-support absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/65 to-transparent px-3 pb-3 pt-10 text-[11px] font-medium text-white">
            <span>{item.formatLabel}</span>
            <span>{item.relativeDateLabel}</span>
          </div>
        </div>
      </Link>
      <PerformanceBadge multiplier={item.multiplier} overlay className="absolute left-3 top-3" />
      {item.permalink ? (
        <a
          href={item.permalink}
          target="_blank"
          rel="noreferrer"
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white backdrop-blur-sm hover:bg-black/75"
          aria-label={`Abrir ${item.formatLabel} en Instagram`}
        >
          <ExternalIcon className="size-4" />
        </a>
      ) : null}
      <div className="border-t border-mist px-3 py-3">
        <EngagementSummary item={item} />
        <Link
          href={detailHref}
          className="mt-3 line-clamp-2 block border-t border-mist pt-3 text-[13px] font-medium leading-[1.4] text-ink"
        >
          {captionPreview(item.caption, `${item.formatLabel} sin texto`)}
        </Link>
      </div>
    </article>
  );
}
