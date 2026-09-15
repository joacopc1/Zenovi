import type { ReactNode } from "react";
import { getTrendColorClass, type TrendDirection } from "@/components/home/trend";

/** Una sección del informe: su título y la pregunta que responde. */
export function ReportSection({
  title,
  question,
  children,
}: {
  title: string;
  question: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-12 first:mt-8">
      {/* La pregunta acompaña al título en la misma línea; en pantallas angostas baja sola. */}
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-lg font-semibold tracking-[-0.01em]">{title}</h2>
        <p className="text-[13px] text-graphite">{question}</p>
      </header>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function ReportCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-card border border-mist bg-paper p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export type TileDelta = { direction: TrendDirection; text: string };

/**
 * Número con su contexto: qué es, de dónde sale y contra qué se compara.
 * Las cifras grandes usan figuras proporcionales; las tabulares sólo alinean columnas.
 */
export function StatTile({
  label,
  value,
  detail,
  delta,
  emphasis = false,
}: {
  label: string;
  value: string;
  detail?: string;
  delta?: TileDelta;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-card border border-mist bg-paper px-5 py-4">
      <p className="text-[13px] font-medium text-graphite">{label}</p>
      <p
        className={`mt-2 font-semibold tracking-[-0.025em] ${emphasis ? "text-[34px] leading-none" : "text-2xl leading-tight"}`}
      >
        {value}
      </p>
      {delta ? (
        <p className={`mt-2 text-xs ${getTrendColorClass(delta.direction)}`}>{delta.text}</p>
      ) : null}
      {detail ? <p className={`${delta ? "mt-0.5" : "mt-2"} text-xs text-muted`}>{detail}</p> : null}
    </div>
  );
}

/** Cifras compactas dentro de una card, encima de su gráfico. */
export function InlineStats({ items }: { items: { label: string; value: string; detail: string }[] }) {
  return (
    <dl className="grid grid-cols-3 gap-4 border-b border-mist pb-4">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-xs text-graphite">{item.label}</dt>
          <dd className="mt-1 text-xl font-semibold tracking-[-0.02em]">{item.value}</dd>
          <p className="mt-0.5 text-[11px] leading-4 text-muted">{item.detail}</p>
        </div>
      ))}
    </dl>
  );
}

/**
 * Lugar reservado para un dato que todavía no está conectado. Nunca muestra un número:
 * dice qué va a ir ahí y por qué hoy no está.
 */
export function PendingTile({ label, reason }: { label: string; reason: string }) {
  return (
    <div className="rounded-card border border-mist bg-canvas px-5 py-4">
      <p className="text-[13px] font-medium text-graphite">{label}</p>
      <p className="mt-2 text-xs font-semibold text-muted">Sin conectar</p>
      <p className="mt-1 text-xs leading-5 text-muted">{reason}</p>
    </div>
  );
}

export function PendingPanel({
  title,
  items,
  reason,
}: {
  title: string;
  items: string[];
  reason: string;
}) {
  return (
    <div className="rounded-card border border-mist bg-canvas p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs font-semibold text-muted">Sin conectar</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item} className="rounded-control border border-mist bg-paper px-2.5 py-1 text-xs text-graphite">
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-3 max-w-2xl text-xs leading-5 text-muted">{reason}</p>
    </div>
  );
}
