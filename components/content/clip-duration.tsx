"use client";

import { formatClipDuration, useMediaDuration } from "./use-media-duration";
import { persistReelDuration } from "@/app/(dashboard)/content/[id]/actions";

/**
 * Duración del clip para la vista de detalle. Es el dato que le da sentido al
 * tiempo medio de visualización: 15 s sobre un Reel de 20 s y sobre uno de 90 s
 * describen comportamientos opuestos.
 */
export function ClipDuration({
  mediaId,
  mediaUrl,
  durationMs,
}: {
  mediaId: string;
  mediaUrl: string | null;
  durationMs: number | null;
}) {
  const { cardRef, duration } = useMediaDuration<HTMLSpanElement>(mediaUrl, {
    initialDurationMs: durationMs,
    onDuration: (seconds) => persistReelDuration(mediaId, seconds),
  });

  return (
    <span ref={cardRef} className="tabular-nums">
      {formatClipDuration(duration) ?? "No disponible"}
    </span>
  );
}
