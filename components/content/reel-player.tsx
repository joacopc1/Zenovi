"use client";

export function ReelPlayer({
  mediaUrl,
  posterUrl,
}: {
  mediaUrl: string | null;
  posterUrl: string | null;
}) {
  if (!mediaUrl) {
    return (
      <div className="flex aspect-[9/16] items-center justify-center bg-canvas px-5 text-center text-sm text-muted">
        El video no está disponible en este momento.
      </div>
    );
  }

  return (
    <video
      controls
      playsInline
      preload="metadata"
      poster={posterUrl ?? undefined}
      className="aspect-[9/16] w-full bg-black object-contain"
      aria-label="Reproducir Reel"
    >
      <source src={mediaUrl} type="video/mp4" />
      Tu navegador no puede reproducir este video.
    </video>
  );
}
