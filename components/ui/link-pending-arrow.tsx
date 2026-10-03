"use client";

import { useLinkStatus } from "next/link";
import { ChevronRight, LoaderCircle } from "lucide-react";

/**
 * La flechita de un enlace que avisa cuando está abriendo: mientras la página carga se
 * vuelve un círculo girando. Sin esto, un toque que tarda parece un botón roto.
 * Va siempre dentro de un `<Link>`.
 */
export function LinkPendingArrow({ className = "" }: { className?: string }) {
  const { pending } = useLinkStatus();
  return pending ? (
    <LoaderCircle aria-label="Abriendo" className={`size-4 animate-spin text-ink ${className}`} strokeWidth={1.75} />
  ) : (
    <ChevronRight aria-hidden="true" className={`size-4 text-ink/30 transition-transform group-hover:translate-x-0.5 group-hover:text-ink ${className}`} strokeWidth={1.75} />
  );
}
