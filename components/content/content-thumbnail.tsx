import Image from "next/image";
import type { ContentLibraryItem } from "@/lib/content/library";

export function ContentThumbnail({
  item,
  priority = false,
  interactive = false,
}: {
  item: ContentLibraryItem;
  priority?: boolean;
  interactive?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-canvas ${
        // Reels e Historias son verticales; recortarlos a 4:3 les corta la cara al protagonista.
        item.kind === "publication" ? "aspect-[4/3]" : "aspect-[9/16]"
      }`}
    >
      {item.thumbnailUrl ? (
        <Image
          src={item.thumbnailUrl}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1280px) 350px, (min-width: 768px) 45vw, 100vw"
          className={`object-cover ${interactive ? "transition-transform duration-300 group-hover:scale-[1.015]" : ""}`}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-graphite">
          <span className="flex size-11 items-center justify-center rounded-full border border-mist bg-paper">
            <MediaPlaceholderIcon className="size-5" />
          </span>
        </div>
      )}
    </div>
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
