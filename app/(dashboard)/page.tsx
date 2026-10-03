import Link from "next/link";
import { GettingStarted } from "@/components/home/getting-started";
import { HomeOverview } from "@/components/home/home-overview";
import { SyncNotice } from "@/components/home/sync-notice";
import { SyncButton } from "@/components/home/sync-button";
import { AppHeader } from "@/components/shell/app-header";
import { InstagramConnectionNotice } from "@/components/states/instagram-connection-notice";
import { parseRangeDays } from "@/lib/analytics/range";
import { getAccountContext } from "@/lib/data/account-context";
import { getGettingStarted } from "@/lib/data/getting-started";
import { getHomeOverview } from "@/lib/data/home";
import { greetingFor } from "@/lib/home/home-model";
import { getInstagramDashboardData } from "@/lib/data/instagram-dashboard";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sync?: string | string[]; days?: string | string[] }>;
}) {
  const account = await getAccountContext();
  const query = await searchParams;
  const [dashboard, gettingStarted] = account?.workspace
    ? await Promise.all([
        getInstagramDashboardData(account.workspace.id),
        getGettingStarted(
          account.workspace.id,
          account.userId,
          account.instagram?.status === "connected",
        ),
      ])
    : [null, null];
  const overview = account?.workspace && dashboard?.priority ? await getHomeOverview(account.workspace.id, account.userId, dashboard, parseRangeDays(query.days)) : null;
  const checklist = gettingStarted ? (
    <GettingStarted items={gettingStarted} />
  ) : null;
  // Vinculada pero no sana: explicar por qué, en vez de invitar a conectar de cero.
  const unhealthy =
    account?.instagram && account.instagram.status !== "connected"
      ? account.instagram.status
      : null;

  return (
    <>
      <AppHeader />
      <div className="mx-auto w-full max-w-[1240px] px-5 py-6 md:px-8 md:py-8 lg:px-10">
        {unhealthy ? (
          <>
            <InstagramConnectionNotice status={unhealthy} redirectTo="/" />
            {checklist}
          </>
        ) : dashboard && overview ? (
          <>
            <SyncNotice key={typeof query.sync === "string" ? query.sync : undefined} status={typeof query.sync === "string" ? query.sync : undefined} />
            <header className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold tracking-[-0.02em]">{greeting(firstName(account?.displayName))}</h1>
                <p className="mt-1 text-[13px] text-muted">
                  @{dashboard.username}
                  {dashboard.lastSyncedAt ? ` · actualizado ${formatSyncDate(dashboard.lastSyncedAt)}` : ""}
                </p>
              </div>
              <SyncButton redirectTo="/" />
            </header>
            {checklist}
            <HomeOverview {...overview} />
          </>
        ) : (
          <EmptyDashboard
            connected={Boolean(dashboard)}
            gettingStarted={checklist}
          />
        )}
      </div>
    </>
  );
}

function EmptyDashboard({
  connected,
  gettingStarted,
}: {
  connected: boolean;
  gettingStarted: React.ReactNode;
}) {
  return (
    <>
      <section className="max-w-2xl py-8">
        <p className="text-sm font-semibold">Empezá por acá</p>
        <h1 className="mt-4 max-w-xl text-2xl font-semibold leading-tight tracking-[-0.025em]">
          {connected
            ? "La cuenta está lista; falta la primera sincronización."
            : "Conectá Instagram para activar tu dashboard."}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-graphite">
          {connected
            ? "Cuando haya contenido sincronizado vas a ver métricas, evolución y rendimiento por pieza."
            : "Zenovi necesita una cuenta profesional para reunir las métricas y el contenido del perfil."}
        </p>
        <div className="mt-6">
          {connected ? (
            <SyncButton redirectTo="/" />
          ) : (
            <Link
              href="/onboarding/instagram"
              className="inline-flex min-h-9 items-center rounded-control bg-ink px-4 text-sm font-semibold text-white hover:bg-ink/85"
            >
              Conectar Instagram
            </Link>
          )}
        </div>
      </section>
      {gettingStarted}
    </>
  );
}

/** "Buenas tardes, Joaco" según la hora; sin nombre, sólo el saludo. */
function greeting(name: string | null) {
  const salute = greetingFor(new Date());
  return name ? `${salute}, ${name}` : salute;
}

function firstName(displayName: string | undefined) {
  return displayName?.trim().split(/\s+/)[0] || null;
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
