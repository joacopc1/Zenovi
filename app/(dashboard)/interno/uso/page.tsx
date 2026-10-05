import { notFound } from "next/navigation";
import { AppHeader } from "@/components/shell/app-header";
import { isZenoviAdmin } from "@/lib/admin/access";
import { getUsageReport, USAGE_REPORT_DAYS } from "@/lib/admin/usage-data";
import { USAGE_GROUP_LABELS, type UsageGroup } from "@/lib/admin/usage-report";
import { formatCompact } from "@/lib/format/numbers";

export const metadata = { title: "Uso de IA", robots: { index: false } };

const GROUPS: UsageGroup[] = ["chat", "analysis", "script", "other"];

/**
 * Vista interna: cuántos créditos gasta cada creador y en qué, para decidir los límites de
 * los planes con datos. Para cualquiera fuera del equipo, la página no existe.
 */
export default async function UsagePage() {
  if (!(await isZenoviAdmin())) notFound();
  const report = await getUsageReport();
  const active = report.workspaces.length;

  return (
    <>
      <AppHeader />
      <div className="w-full px-5 py-8 md:px-8 md:py-10 lg:px-10">
        <h1 className="text-xl font-semibold tracking-[-0.02em]">Uso de IA</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-graphite">
          Últimos {USAGE_REPORT_DAYS} días, por creador. Sólo lo ve el equipo de Zenovi.
        </p>

        <dl className="mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
          <Stat label="Créditos gastados" value={formatCredits(report.totals.credits)} />
          <Stat label="Costo real" value={formatUsd(report.totals.costUsd)} />
          <Stat label="Creadores que usaron IA" value={String(active)} />
        </dl>

        <section className="mt-6 overflow-hidden rounded-card border border-mist bg-paper">
          {active === 0 ? (
            <p className="p-6 text-sm text-graphite">Nadie usó la IA en estos {USAGE_REPORT_DAYS} días.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-[13px]">
                <thead className="border-b border-mist text-[12px] text-graphite">
                  <tr>
                    <th className="px-5 py-3 font-medium">Creador</th>
                    <th className="px-3 py-3 text-right font-medium">Créditos</th>
                    <th className="px-3 py-3 text-right font-medium">Por día activo</th>
                    <th className="px-3 py-3 text-right font-medium">Día pico</th>
                    <th className="px-3 py-3 text-right font-medium">Días activos</th>
                    {GROUPS.map((group) => (
                      <th key={group} className="px-3 py-3 text-right font-medium">{USAGE_GROUP_LABELS[group]}</th>
                    ))}
                    <th className="px-3 py-3 text-right font-medium">Costo</th>
                    <th className="px-5 py-3 text-right font-medium">Último uso</th>
                  </tr>
                </thead>
                <tbody>
                  {report.workspaces.map((usage) => (
                    <tr key={usage.workspaceId} className="border-b border-mist last:border-b-0">
                      <td className="px-5 py-3">
                        <p className="font-medium text-ink">{usage.name}</p>
                        <p className="text-[12px] text-muted">{usage.instagram ? `@${usage.instagram}` : "Sin Instagram"}</p>
                      </td>
                      <Num value={formatCredits(usage.credits)} strong />
                      <Num value={formatCredits(usage.perActiveDay)} />
                      <Num value={formatCredits(usage.peakDay)} />
                      <Num value={String(usage.activeDays)} />
                      {GROUPS.map((group) => (
                        <Num key={group} value={formatCredits(usage.byGroup[group])} />
                      ))}
                      <Num value={formatUsd(usage.costUsd)} />
                      <td className="px-5 py-3 text-right text-graphite">{formatDate(usage.lastUsedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        {report.truncated ? (
          <p className="mt-3 text-[12px] text-graphite">Se muestran los últimos 50.000 registros; el total real es mayor.</p>
        ) : null}
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-mist bg-paper p-5">
      <dt className="text-[12px] text-graphite">{label}</dt>
      <dd className="mt-1 font-numeric text-[24px] font-bold tracking-[-0.02em] text-ink">{value}</dd>
    </div>
  );
}

function Num({ value, strong = false }: { value: string; strong?: boolean }) {
  return <td className={`px-3 py-3 text-right font-numeric tabular-nums ${strong ? "font-semibold text-ink" : "text-graphite"}`}>{value}</td>;
}

function formatCredits(value: number) {
  return value >= 1000 ? formatCompact(value) : new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 }).format(value);
}

function formatUsd(value: number) {
  return `US$${new Intl.NumberFormat("es-UY", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "short", timeZone: "America/Montevideo" }).format(new Date(value));
}
