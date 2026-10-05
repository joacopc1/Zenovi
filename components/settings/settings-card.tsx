import type { ReactNode } from "react";

/** Una sección de Ajustes: título, una línea que explica y el contenido; opcionalmente un pie gris. */
export function SettingsCard({
  title,
  description,
  children,
  footer,
  danger = false,
}: {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  danger?: boolean;
}) {
  return (
    <section className={`overflow-hidden rounded-card border bg-paper ${danger ? "border-danger/30 bg-danger/[0.03]" : "border-mist"}`}>
      <div className="p-5">
        <h2 className={`text-[18px] font-semibold tracking-[-0.015em] ${danger ? "text-danger" : "text-ink"}`}>{title}</h2>
        {description ? <p className="font-support mt-1 text-[13px] leading-5 text-graphite">{description}</p> : null}
        {children ? <div className="mt-4">{children}</div> : null}
      </div>
      {footer ? <div className="border-t border-mist bg-canvas/60 px-5 py-3">{footer}</div> : null}
    </section>
  );
}

/** Una fila de dato dentro de una card: nombre a la izquierda, valor a la derecha. */
export function SettingsRow({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mist py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {hint ? <p className="font-support text-xs text-graphite">{hint}</p> : null}
      </div>
      <div className="text-sm text-ink">{children}</div>
    </div>
  );
}
