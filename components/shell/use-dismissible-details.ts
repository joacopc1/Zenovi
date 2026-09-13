"use client";

import { useEffect, useRef } from "react";

export function useDismissibleDetails() {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (!detailsRef.current || event.composedPath().includes(detailsRef.current)) return;
      detailsRef.current.removeAttribute("open");
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        detailsRef.current?.removeAttribute("open");
        detailsRef.current?.querySelector<HTMLElement>("summary")?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return detailsRef;
}
