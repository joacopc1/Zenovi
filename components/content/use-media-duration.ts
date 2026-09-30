"use client";

import { useEffect, useRef, useState } from "react";
import { durationSecondsFromMs } from "@/lib/content/media-duration";

type MediaDurationOptions = {
  initialDurationMs?: number | null;
  onDuration?: (seconds: number) => void | Promise<void>;
};

/**
 * Lee la duración real del archivo de video, que Instagram no entrega como métrica.
 *
 * Sólo pide los metadatos y recién cuando el elemento se acerca al viewport, para no
 * disparar una descarga por cada pieza de la biblioteca al abrir la página.
 */
export function useMediaDuration<T extends HTMLElement>(
  mediaUrl: string | null,
  { initialDurationMs = null, onDuration }: MediaDurationOptions = {},
) {
  const cardRef = useRef<T>(null);
  const onDurationRef = useRef(onDuration);
  const [measurement, setMeasurement] = useState<{
    mediaUrl: string;
    seconds: number;
  } | null>(null);
  const storedDuration = durationSecondsFromMs(initialDurationMs);
  const duration =
    storedDuration ?? (measurement?.mediaUrl === mediaUrl ? measurement.seconds : null);

  useEffect(() => {
    onDurationRef.current = onDuration;
  }, [onDuration]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || !mediaUrl || storedDuration !== null) return;
    let media: HTMLVideoElement | null = null;

    const loadDuration = () => {
      if (media) return;
      media = document.createElement("video");
      media.preload = "metadata";
      media.addEventListener("loadedmetadata", updateDuration);
      media.src = mediaUrl;
    };

    const updateDuration = () => {
      if (media && Number.isFinite(media.duration) && media.duration > 0) {
        const seconds = media.duration;
        setMeasurement({ mediaUrl, seconds });
        void Promise.resolve(onDurationRef.current?.(seconds)).catch(() => {
          // La duración sigue siendo útil durante esta sesión aunque la persistencia falle.
        });
      }
    };

    let observer: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return;
          loadDuration();
          observer?.disconnect();
        },
        { rootMargin: "300px" },
      );
      observer.observe(card);
    } else {
      loadDuration();
    }

    return () => {
      observer?.disconnect();
      if (media) {
        media.removeEventListener("loadedmetadata", updateDuration);
        media.removeAttribute("src");
        media.load();
      }
    };
  }, [mediaUrl, storedDuration]);

  return { cardRef, duration };
}

/** Duración de un clip en minutos:segundos. Recibe segundos, no milisegundos. */
export function formatClipDuration(seconds: number | null) {
  if (seconds === null) return null;

  const rounded = Math.round(seconds);
  const minutes = Math.floor(rounded / 60);
  return `${minutes}:${String(rounded % 60).padStart(2, "0")}`;
}
