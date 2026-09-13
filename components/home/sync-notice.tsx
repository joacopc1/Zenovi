"use client";

import { useEffect, useState } from "react";
import { CloseIcon } from "@/components/shell/icons";

type SyncNoticeProps = {
  status?: string;
};

export function SyncNotice({ status }: SyncNoticeProps) {
  const visibleStatus = status === "updated" || status === "error" ? status : null;
  const [visible, setVisible] = useState(Boolean(visibleStatus));

  useEffect(() => {
    if (!visibleStatus) return;

    const timeout = window.setTimeout(() => setVisible(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [visibleStatus]);

  if (!visible || !visibleStatus) return null;

  return (
    <div
      role={visibleStatus === "error" ? "alert" : "status"}
      className="fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-4 rounded-control border border-mist bg-paper px-4 py-3 text-xs shadow-[0_10px_28px_rgba(0,0,0,0.10)]"
    >
      <span>
        <strong className="block font-semibold">
          {visibleStatus === "updated" ? "Datos actualizados" : "No pudimos actualizar"}
        </strong>
        <span className="mt-0.5 block text-[11px] text-graphite">
          {visibleStatus === "updated"
            ? "Las métricas ya usan la información más reciente."
            : "Intentá nuevamente dentro de unos minutos."}
        </span>
      </span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="grid size-6 shrink-0 place-items-center rounded-control text-muted hover:bg-canvas hover:text-ink"
        aria-label="Cerrar notificación"
      >
        <CloseIcon className="size-3.5" />
      </button>
    </div>
  );
}
