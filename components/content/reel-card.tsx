"use client";

import Image from "next/image";
import Link from "next/link";
import type { RankedContentItem } from "@/lib/content/library";
import { EngagementSummary } from "./engagement-summary";
import { ExternalIcon } from "./metric-icons";
import { PerformanceBadge } from "./performance-badge";
import { formatClipDuration, useMediaDuration } from "./use-media-duration";

export function ReelCard({ item, priority }: { item: RankedContentItem; priority?: boolean }) {
  const { cardRef, duration } = useMediaDuration(item.mediaUrl);
  const detailHref = `/content/${item.id}`;

  return (
    <article ref={cardRef} className="group relative overflow-hidden rounded-card border border-mist bg-paper transition-colors hover:bg-ink/[0.035]">
      <Link href={detailHref} className="block" aria-label={`Abrir detalle del Reel del ${item.dateLabel}`}>
        <div className="relative aspect-[9/16] overflow-hidden bg-canvas">
          {item.thumbnailUrl ? (
            <Image
              src={item.thumbnailUrl}
              alt=""
              fill
              priority={priority}
              sizes="(min-width: 1280px) 260px, (min-width: 768px) 32vw, 80vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.015]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">Vista previa no disponible</div>
          )}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/65 to-transparent px-3 pb-3 pt-12 text-xs font-medium text-white">
            <span>{formatClipDuration(duration) ?? "Duración —"}</span>
            <span>{item.relativeDateLabel}</span>
          </div>
        </div>
      </Link>

      <PerformanceBadge multiplier={item.multiplier} className="absolute left-3 top-3" />

      {item.permalink ? (
        <a
          href={item.permalink}
          target="_blank"
          rel="noreferrer"
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white backdrop-blur-sm hover:bg-black/75"
          aria-label="Abrir Reel en Instagram"
        >
          <ExternalIcon className="size-4" />
        </a>
      ) : null}

      <div className="px-3 py-3">
        <EngagementSummary item={item} />
        <Link
          href={detailHref}
          className="mt-3 line-clamp-2 block border-t border-mist pt-3 text-[13px] font-medium leading-[1.4] text-ink"
        >
          {item.caption?.trim() || "Reel sin texto"}
        </Link>
      </div>
    </article>
  );
}


