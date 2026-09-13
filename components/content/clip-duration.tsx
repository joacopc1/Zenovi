"use client";

import { formatClipDuration, useMediaDuration } from "./use-media-duration";

/**
 * Duración del clip para la vista de detalle. Es el dato que le da sentido al
 * tiempo medio de visualización: 15 s sobre un Reel de 20 s y sobre uno de 90 s
 * describen comportamientos opuestos.
 */
export function ClipDuration({ mediaUrl }: { mediaUrl: string | null }) {
  const { cardRef, duration } = useMediaDuration<HTMLSpanElement>(mediaUrl);

  return (
    <span ref={cardRef} className="tabular-nums">
      {formatClipDuration(duration) ?? "No disponible"}
    </span>
  );
}
