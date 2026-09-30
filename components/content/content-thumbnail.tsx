"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useTransition, type ReactNode } from "react";
import { persistMediaDimensions } from "@/app/(dashboard)/content/media-actions";
import type { ContentLibraryItem, ContentMediaSlide } from "@/lib/content/library";

export function ContentThumbnail({
  item,
  priority = false,
  interactive = false,
}: {
  item: ContentLibraryItem;
  priority?: boolean;
  interactive?: boolean;
}) {
  const slides = mediaSlides(item);
  const [activeIndex, setActiveIndex] = useState(0);
  const [measuredRatio, setMeasuredRatio] = useState<number | null>(null);
  const dimensionsRequested = useRef(false);
  const [, startTransition] = useTransition();
  const active = slides[activeIndex] ?? null;
  const usePublicationGridFrame = interactive === true && item.kind === "publication";
  const storedRatio =
    item.mediaWidth !== null && item.mediaHeight !== null
      ? item.mediaWidth / item.mediaHeight
      : null;
  const aspectRatio = usePublicationGridFrame ? null : measuredRatio ?? storedRatio;

  function rememberDimensions(width: number, height: number) {
    if (width <= 0 || height <= 0) return;
    setMeasuredRatio(width / height);
    if (
      dimensionsRequested.current ||
      (item.mediaWidth !== null && item.mediaHeight !== null)
    ) return;
    dimensionsRequested.current = true;
    startTransition(() => persistMediaDimensions(item.id, width, height));
  }

  return (
    <div
      className={`relative overflow-hidden bg-canvas ${
        usePublicationGridFrame
          ? "aspect-[3/4]"
          : aspectRatio === null
          ? item.kind === "publication"
            ? "aspect-square"
            : "aspect-[9/16]"
          : ""
      }`}
      style={aspectRatio === null ? undefined : { aspectRatio }}
    >
      {active?.mediaUrl || active?.thumbnailUrl ? (
        active.mediaType === "VIDEO" && active.mediaUrl ? (
          <video
            src={active.mediaUrl}
            poster={active.thumbnailUrl ?? undefined}
            controls={!interactive}
            playsInline
            preload="metadata"
            onLoadedMetadata={(event) =>
              rememberDimensions(event.currentTarget.videoWidth, event.currentTarget.videoHeight)
            }
            className={`h-full w-full bg-black ${usePublicationGridFrame ? "object-cover" : "object-contain"}`}
            aria-label={slides.length > 1 ? `Video ${activeIndex + 1} del carrusel` : "Video del post"}
          />
        ) : (
          <Image
            src={active.mediaUrl ?? active.thumbnailUrl ?? ""}
            alt=""
            fill
            priority={priority && activeIndex === 0}
            sizes="(min-width: 1280px) 350px, (min-width: 768px) 45vw, 100vw"
            onLoad={(event) =>
              rememberDimensions(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)
            }
            className={`${usePublicationGridFrame ? "object-cover" : "object-contain"} ${
              interactive ? "transition-transform duration-300 group-hover:scale-[1.015]" : ""
            }`}
          />
        )
      ) : (
        <div className="flex h-full items-center justify-center text-graphite">
          <span className="flex size-11 items-center justify-center rounded-full border border-mist bg-paper">
            <MediaPlaceholderIcon className="size-5" />
          </span>
        </div>
      )}

      {slides.length > 1 ? (
        <>
          {activeIndex > 0 ? (
            <SlideButton
              label="Ver slide anterior"
              side="left"
              onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
            >
              <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={2} />
            </SlideButton>
          ) : null}
          {activeIndex < slides.length - 1 ? (
            <SlideButton
              label="Ver siguiente slide"
              side="right"
              onClick={() => setActiveIndex((index) => Math.min(slides.length - 1, index + 1))}
            >
              <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2} />
            </SlideButton>
          ) : null}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center gap-1"
            aria-hidden="true"
          >
            {slides.map((slide, index) => (
              <span
                key={`${slide.position}-${index}`}
                className={`size-1.5 rounded-full ${index === activeIndex ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function mediaSlides(item: ContentLibraryItem): ContentMediaSlide[] {
  if (item.slides.length > 0) return item.slides;
  return [{
    position: 0,
    mediaType: item.comparisonFormat === "video" ? "VIDEO" : "IMAGE",
    mediaUrl: item.mediaUrl ?? item.thumbnailUrl,
    thumbnailUrl: item.thumbnailUrl,
  }];
}

function SlideButton({
  label,
  side,
  onClick,
  children,
}: {
  label: string;
  side: "left" | "right";
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className={`absolute top-1/2 z-40 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/55 text-ink transition-colors hover:bg-white/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      {children}
    </button>
  );
}

function MediaPlaceholderIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m5.5 17 4.1-4 3.2 3 2.1-2 3.6 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
