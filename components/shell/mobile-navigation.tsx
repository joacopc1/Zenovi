"use client";

import { useRef } from "react";
import { CloseIcon, MenuIcon } from "./icons";
import { SidebarContent } from "./sidebar-content";

export function MobileNavigation() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        className="grid size-9 place-items-center rounded-control text-graphite hover:bg-ink/[0.04] hover:text-ink md:hidden"
        aria-label="Abrir navegación"
        onClick={() => dialogRef.current?.showModal()}
      >
        <MenuIcon className="size-[18px]" />
      </button>

      <dialog
        ref={dialogRef}
        className="m-0 h-dvh max-h-none w-[min(20rem,calc(100%-2rem))] max-w-none border-0 bg-canvas p-0 text-ink backdrop:bg-ink/25"
        aria-label="Navegación principal"
      >
        <div className="flex h-full flex-col px-3.5 py-4">
          <button
            type="button"
            className="mb-3 ml-auto grid size-9 place-items-center rounded-control text-graphite hover:bg-ink/[0.04] hover:text-ink"
            aria-label="Cerrar navegación"
            onClick={close}
          >
            <CloseIcon className="size-[18px]" />
          </button>
          <SidebarContent onNavigate={close} />
        </div>
      </dialog>
    </>
  );
}
