import { AppHeader } from "@/components/shell/app-header";
import { AppShell } from "@/components/shell/app-shell";

const metrics = [
  { label: "Reproducciones", value: "1.284", note: "↑ 18% vs. periodo anterior", positive: true },
  { label: "Alcance", value: "892", note: "↑ 11% vs. periodo anterior", positive: true },
  { label: "Interacciones", value: "74", note: "Sin cambio significativo" },
  { label: "Seguidores", value: "3", note: "Total actual de la cuenta" },
];

export default function Home() {
  return (
    <AppShell>
      <AppHeader title="Inicio" />
      <div className="mx-auto max-w-[1180px] px-5 py-9 md:px-10 md:py-12">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">Brief del jueves</p>
        <h1 className="max-w-3xl text-[clamp(2.25rem,4.1vw,3.25rem)] font-bold leading-[1.02] tracking-[-0.045em]">Hay una señal clara en tus primeros segundos.</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-6 text-graphite">Tu último Reel consiguió distribución, pero perdió atención antes de presentar la promesa. Esta es la oportunidad más importante para tu próxima pieza.</p>

        <section className="relative mt-10 grid overflow-hidden rounded-card border border-mist lg:grid-cols-[1.45fr_.7fr] before:absolute before:left-7 before:top-0 before:h-3 before:w-px before:-translate-y-full before:bg-ink">
          <div className="p-7"><p className="flex items-center gap-2 text-xs font-semibold text-graphite"><span className="size-[7px] rounded-full bg-ink"/>Señal prioritaria · Reel del 2 de septiembre</p><h2 className="mt-4 max-w-2xl text-2xl font-semibold leading-tight tracking-[-0.025em]">El 41,9% omitió el video durante los primeros tres segundos.</h2><p className="mt-3 text-[13px] leading-5 text-graphite">El alcance fue estable frente a tu referencia, pero el hook tardó en revelar el conflicto. Conservá el encuadre y adelantá la promesa al primer segundo.</p></div>
          <aside className="border-t border-mist p-7 lg:border-l lg:border-t-0"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Próxima acción</p><p className="my-3 text-base font-semibold leading-snug">Crear tres variantes de hook para volver a probar la idea.</p><button className="text-xs font-semibold underline underline-offset-4">Trabajar con el Director →</button></aside>
        </section>

        <section className="mt-12"><div><h2 className="text-lg font-semibold tracking-tight">Panorama</h2><p className="mt-1 text-[11px] text-muted">Datos oficiales de Instagram · últimos 7 días</p></div><div className="mt-5 grid grid-cols-2 border-y border-mist lg:grid-cols-4">{metrics.map((metric, index) => <div key={metric.label} className={`min-w-0 py-5 ${index % 2 === 0 ? "pr-4" : "border-l border-mist pl-4"} ${index > 1 ? "border-t border-mist lg:border-t-0" : ""} lg:border-l lg:px-5 lg:first:border-l-0 lg:first:pl-0`}><p className="text-xs text-graphite">{metric.label}</p><p className="mt-3 text-[27px] font-semibold tracking-tight tabular-nums">{metric.value}</p><p className={`mt-1.5 text-[10px] ${metric.positive ? "text-success" : "text-muted"}`}>{metric.note}</p></div>)}</div></section>
      </div>
    </AppShell>
  );
}
