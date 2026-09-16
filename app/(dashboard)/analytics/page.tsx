import Link from "next/link";
import { AnalyticsReport } from "@/components/analytics/analytics-report";
import { DateRangePicker } from "@/components/analytics/date-range-picker";
import { SyncButton } from "@/components/home/sync-button";
import { SyncNotice } from "@/components/home/sync-notice";
import { InstagramConnectionNotice } from "@/components/states/instagram-connection-notice";
import { AppHeader } from "@/components/shell/app-header";
import { getAccountContext } from "@/lib/data/account-context";
import { getInstagramContentLibrary } from "@/lib/data/instagram-content";
import { getInstagramDashboardData } from "@/lib/data/instagram-dashboard";
import { buildAnalyticsHref, buildRangeHref, parseAnalyticsTab, parseRangeDays } from "@/lib/analytics/range";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{
    sync?: string | string[];
    days?: string | string[];
    tab?: string | string[];
  }>;
}) {
  const account = await getAccountContext();
  const query = await searchParams;
  const rangeDays = parseRangeDays(query.days);
  const tab = parseAnalyticsTab(query.tab);
  // La biblioteca aporta portada, texto y formato de cada pieza para "Qué funcionó".
  const [dashboard, contentLibrary] = account?.workspace
    ? await Promise.all([
        getInstagramDashboardData(account.workspace.id),
        getInstagramContentLibrary(account.workspace.id),
      ])
    : [null, null];
  // Vinculada pero no sana: mostrar por qué, en vez de invitar a conectar de cero.
  const unhealthy =
    account?.instagram && account.instagram.status !== "connected"
      ? account.instagram.status
      : null;
  // Conectado no es lo mismo que con datos: si Meta no devolvió ninguna métrica,
  // graficar la serie mostraría ceros donde en realidad no hay información.
  const hasAnyMetric = Boolean(
    dashboard &&
      (dashboard.availableAccountMetrics.length > 0 ||
        dashboard.availableDailyMetrics.length > 0),
  );

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-[1240px] px-5 py-6 md:px-8 md:py-8 lg:px-10">
        <SyncNotice
          key={typeof query.sync === "string" ? query.sync : undefined}
          status={typeof query.sync === "string" ? query.sync : undefined}
        />

        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-[-0.02em]">Analíticas</h1>
            {/* Con datos a la vista, la cuenta ya la dice la barra lateral y el período
                el selector: la línea sólo aparece cuando hay algo que explicar. */}
            {hasAnyMetric ? null : (
              <p className="mt-1 text-[13px] text-muted">
                {dashboard
                  ? `@${dashboard.username} · esperando datos de Instagram`
                  : "Rendimiento de tu cuenta de Instagram"}
              </p>
            )}
          </div>
          {hasAnyMetric ? (
            <div className="flex items-center gap-2">
              <DateRangePicker basePath="/analytics" selected={rangeDays} tab={tab} />
              <SyncButton redirectTo={buildAnalyticsHref("/analytics", rangeDays, tab)} />
            </div>
          ) : null}
        </header>

        {unhealthy ? (
          <InstagramConnectionNotice
            status={unhealthy}
            redirectTo={buildRangeHref("/analytics", rangeDays)}
          />
        ) : dashboard && !hasAnyMetric ? (
          <section className="mt-8 max-w-xl rounded-card border border-mist p-6">
            <h2 className="text-lg font-semibold">La cuenta está conectada, pero todavía no llegaron métricas</h2>
            <p className="mt-2 text-sm leading-6 text-graphite">
              Instagram todavía no devolvió estadísticas para @{dashboard.username}. Suele pasar
              cuando la conexión es muy reciente o cuando la cuenta aún no acumuló actividad
              suficiente en el período. Zenovi prefiere no mostrar nada antes que dibujar ceros
              que parecerían una caída.
            </p>
            <div className="mt-5">
              <SyncButton redirectTo="/analytics" />
            </div>
          </section>
        ) : dashboard ? (
          <AnalyticsReport
            dashboard={dashboard}
            contentItems={contentLibrary?.items ?? []}
            days={rangeDays}
            tab={tab}
          />
        ) : (
          <section className="mt-8 max-w-xl rounded-card border border-mist p-6">
            <h2 className="text-lg font-semibold">Conectá Instagram para ver tus analíticas</h2>
            <p className="mt-2 text-sm leading-5 text-graphite">
              Cuando la cuenta esté conectada, Zenovi reunirá la evolución y el rendimiento de tus publicaciones.
            </p>
            <Link
              href="/onboarding/instagram"
              className="mt-5 inline-flex min-h-9 items-center rounded-control bg-ink px-4 text-sm font-semibold text-paper hover:bg-ink/85"
            >
              Conectar Instagram
            </Link>
          </section>
        )}
      </main>
    </>
  );
}
