"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { readReelSeekMoment, REEL_SEEK_EVENT } from "@/lib/content/reel-seek";

export function ReelPlayer({
  mediaUrl,
  posterUrl,
}: {
  mediaUrl: string | null;
  posterUrl: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    function seek(event: Event) {
      const atMs = readReelSeekMoment(event);
      const video = videoRef.current;
      if (!video || atMs === null) return;
      video.currentTime = atMs / 1000;
      void video.play();
    }

    window.addEventListener(REEL_SEEK_EVENT, seek);
    return () => window.removeEventListener(REEL_SEEK_EVENT, seek);
  }, []);

  if (!mediaUrl) {
    return (
      <div className="relative aspect-[9/16] overflow-hidden bg-canvas">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt=""
            fill
            priority
            sizes="270px"
            className="object-cover"
          />
        ) : null}
        <div
          className={`absolute inset-x-0 bottom-0 px-4 pb-4 pt-14 text-center font-support text-xs ${
            posterUrl
              ? "bg-gradient-to-t from-black/65 to-transparent text-white/85"
              : "top-0 flex items-center justify-center text-muted"
          }`}
        >
          Instagram no está entregando el video en este momento.
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
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
