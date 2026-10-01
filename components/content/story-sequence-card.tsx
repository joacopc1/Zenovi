"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import type { StorySequence } from "@/lib/content/story-sequences";
import { formatCompact } from "@/lib/format/numbers";
import { SlideButton } from "./content-thumbnail";

/**
 * Una secuencia en la biblioteca, para reconocerla antes de entrar: se recorre con las
 * flechas como un carrusel, los segmentos de arriba marcan cuál se ve (como en Instagram)
 * y cada Historia muestra sus views. El resto de las métricas está al entrar.
 */
export function StorySequenceCard({
  sequence,
  dayLabel,
  ageLabels,
  priority = false,
}: {
  sequence: StorySequence;
  /** Se calculan en el servidor: dependen del reloj y no deben cambiar al hidratar. */
  dayLabel: string;
  /** "Hace 3 h", uno por Historia, en el mismo orden. */
  ageLabels: string[];
  priority?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const story = sequence.stories[index];
  const imageUrl = story.thumbnailUrl ?? story.mediaUrl;
  const count = sequence.stories.length;

  return (
    <article className="group relative overflow-hidden rounded-card border border-mist bg-paper transition-colors hover:bg-ink/[0.035]">
      <Link
        href={`/content/${sequence.stories[0].id}?type=story`}
        aria-label={`Abrir la secuencia de ${dayLabel}, ${count} ${count === 1 ? "Historia" : "Historias"}`}
        className="absolute inset-0 z-10"
      />

      <div className="group/slides relative aspect-[9/16] overflow-hidden bg-canvas">
        {imageUrl ? (
          <Image
            key={story.id}
            src={imageUrl}
            alt=""
            fill
            priority={priority && index === 0}
            sizes="(min-width: 1280px) 260px, (min-width: 768px) 32vw, 80vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">Vista previa no disponible</div>
        )}

        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/45 to-transparent px-3 pb-8 pt-3" aria-hidden="true">
          <div className="flex gap-1">
            {sequence.stories.map((item, position) => (
              <span
                key={item.id}
                className={`h-[3px] flex-1 rounded-full transition-colors ${position === index ? "bg-white" : "bg-white/35"}`}
              />
            ))}
          </div>
          <p className="mt-2 flex items-center justify-between text-[11px] font-medium text-white/90">
            <span>{ageLabels[index]}</span>
            <span className="font-numeric">{index + 1}/{count}</span>
          </p>
        </div>

        {count > 1 ? (
          <>
            {index > 0 ? (
              <SlideButton label="Ver Historia anterior" side="left" onClick={() => setIndex(index - 1)}>
                <ChevronLeft aria-hidden="true" className="size-3.5" strokeWidth={2} />
              </SlideButton>
            ) : null}
            {index < count - 1 ? (
              <SlideButton label="Ver Historia siguiente" side="right" onClick={() => setIndex(index + 1)}>
                <ChevronRight aria-hidden="true" className="size-3.5" strokeWidth={2} />
              </SlideButton>
            ) : null}
          </>
        ) : null}

        <span className="font-numeric absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-black/60 to-transparent pb-3 pt-10 text-[12px] font-medium text-white">
          <Eye aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
          {formatCompact(story.views)}
          <span className="sr-only">views</span>
        </span>
      </div>

      <p className="px-3 py-3 text-[13px] font-medium text-ink">{dayLabel}</p>
    </article>
  );
}
