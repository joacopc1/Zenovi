import { AppHeader } from "@/components/shell/app-header";
import { getAccountContext } from "@/lib/data/account-context";
import {
  getInstagramDashboardData,
  type InstagramDashboardData,
} from "@/lib/data/instagram-dashboard";

type Metric = {
  label: string;
  value: string;
  note: string;
};

const numberFormatter = new Intl.NumberFormat("es-UY");

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sync?: string | string[] }>;
}) {
  const account = await getAccountContext();
  const query = await searchParams;
  const dashboard = account?.workspace
    ? await getInstagramDashboardData(account.workspace.id)
    : null;

  return (
    <>
      <AppHeader title="Inicio" />
      <div className="mx-auto max-w-[1180px] px-5 py-9 md:px-10 md:py-12">
        {dashboard?.priority ? (
          <ConnectedDashboard
            dashboard={dashboard}
            syncStatus={typeof query.sync === "string" ? query.sync : undefined}
          />
        ) : (
          <EmptyDashboard connected={Boolean(dashboard)} />
        )}
      </div>
    </>
  );
}

function ConnectedDashboard({
  dashboard,
  syncStatus,
}: {
  dashboard: InstagramDashboardData;
  syncStatus?: string;
}) {
  const priority = dashboard.priority;
  if (!priority) return null;

  const multiplier = priority.reachMultiplier;
  const headline = multiplier
    ? `Tu ${priority.contentLabel} alcanzó ${formatMultiplier(multiplier)} veces más cuentas que tu siguiente pieza.`
    : `Tu ${priority.contentLabel} es la pieza con mayor alcance entre las sincronizadas.`;
  const metrics: Metric[] = [
    {
      label: "Reproducciones",
      value: formatNumber(dashboard.sevenDayViews),
      note: "Últimos 7 días",
    },
    {
      label: "Alcance diario",
      value: formatNumber(dashboard.sevenDayReach),
      note: "Suma de los últimos 7 días",
    },
    {
      label: "Interacciones",
      value: formatNumber(dashboard.totalMediaInteractions),
      note: `${dashboard.syncedMediaCount} publicaciones sincronizadas`,
    },
    {
      label: "Seguidores",
      value: formatNumber(dashboard.followers),
      note: `Total actual de @${dashboard.username}`,
    },
  ];

  return (
    <>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
        Brief de hoy
      </p>
      <h1 className="max-w-3xl text-[clamp(2.25rem,4.1vw,3.25rem)] font-bold leading-[1.02] tracking-[-0.045em]">
        Tu {priority.contentLabel.toLocaleLowerCase("es")} está llevando la cuenta.
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-6 text-graphite">
        Entre tus {dashboard.syncedMediaCount} publicaciones sincronizadas, una pieza concentra la
        señal más clara. Usala como referencia antes de crear la próxima.
      </p>

      <section className="relative mt-10 grid overflow-hidden rounded-card border border-mist before:absolute before:left-7 before:top-0 before:h-3 before:w-px before:-translate-y-full before:bg-ink lg:grid-cols-[1.45fr_.7fr]">
        <div className="p-7">
          <p className="flex items-center gap-2 text-xs font-semibold text-graphite">
            <span className="size-[7px] rounded-full bg-ink" />
            Señal prioritaria · {priority.contentLabel} del {priority.dateLabel}
          </p>
          <h2 className="mt-4 max-w-2xl text-2xl font-semibold leading-tight tracking-[-0.025em]">
            {headline}
          </h2>
          <p className="mt-3 text-[13px] leading-5 text-graphite">
            Registró {formatNumber(priority.views)} reproducciones, {formatNumber(priority.reach)} de
            alcance y {formatNumber(priority.interactions)} interacciones. Es tu mejor referencia
            disponible para decidir qué formato volver a probar.
          </p>
        </div>
        <aside className="border-t border-mist p-7 lg:border-l lg:border-t-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
            Próxima acción
          </p>
          <p className="my-3 text-base font-semibold leading-snug">
            Usar esta pieza como referencia para tu próximo contenido.
          </p>
          {priority.permalink ? (
            <a
              href={priority.permalink}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold underline underline-offset-4"
            >
              Ver en Instagram →
            </a>
          ) : null}
        </aside>
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Panorama</h2>
            <p className="mt-1 text-[11px] text-muted">
              Datos oficiales de Instagram
              {dashboard.lastSyncedAt
                ? ` · actualizados ${formatSyncDate(dashboard.lastSyncedAt)}`
                : ""}
            </p>
          </div>
          <form action="/api/integrations/instagram/sync" method="post">
            <input type="hidden" name="redirectTo" value="/" />
            <button
              type="submit"
              className="h-8 rounded-control border border-mist px-3 text-[11px] font-semibold text-graphite hover:border-ink/20 hover:text-ink"
            >
              Actualizar datos
            </button>
          </form>
        </div>
        {syncStatus === "updated" ? (
          <p className="mt-3 text-[11px] text-success">Los datos se actualizaron correctamente.</p>
        ) : null}
        {syncStatus === "error" ? (
          <p className="mt-3 text-[11px] text-warning">
            No pudimos actualizar los datos. Intentá nuevamente.
          </p>
        ) : null}
        <div className="mt-5 grid grid-cols-2 border-y border-mist lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className={`min-w-0 py-5 ${
                index % 2 === 0 ? "pr-4" : "border-l border-mist pl-4"
              } ${
                index > 1 ? "border-t border-mist lg:border-t-0" : ""
              } lg:border-l lg:px-5 lg:first:border-l-0 lg:first:pl-0`}
            >
              <p className="text-xs text-graphite">{metric.label}</p>
              <p className="mt-3 text-[27px] font-semibold tracking-tight tabular-nums">
                {metric.value}
              </p>
              <p className="mt-1.5 text-[10px] text-muted">{metric.note}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function EmptyDashboard({ connected }: { connected: boolean }) {
  return (
    <section className="max-w-2xl py-12">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
        Brief de hoy
      </p>
      <h1 className="text-[clamp(2.25rem,4.1vw,3.25rem)] font-bold leading-[1.02] tracking-[-0.045em]">
        {connected ? "Instagram está conectado." : "Conectá Instagram para empezar."}
      </h1>
      <p className="mt-4 text-[15px] leading-6 text-graphite">
        {connected
          ? "Todavía no encontramos publicaciones para analizar. Volvé a sincronizar cuando tengas contenido disponible."
          : "Cuando conectes tu cuenta, Zenovi convertirá tus métricas en señales concretas para tu próxima pieza."}
      </p>
    </section>
  );
}

function formatNumber(value: number) {
  return numberFormatter.format(Math.round(value));
}

function formatMultiplier(value: number) {
  return new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 }).format(value);
}

function formatSyncDate(value: string) {
  return new Intl.DateTimeFormat("es-UY", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Montevideo",
  }).format(new Date(value));
}
