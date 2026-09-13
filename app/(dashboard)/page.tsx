import Link from "next/link";
import { ConnectedDashboard } from "@/components/home/connected-dashboard";
import { SyncButton } from "@/components/home/sync-button";
import { AppHeader } from "@/components/shell/app-header";
import { InstagramConnectionNotice } from "@/components/states/instagram-connection-notice";
import { getAccountContext } from "@/lib/data/account-context";
import { getInstagramDashboardData } from "@/lib/data/instagram-dashboard";

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
          <InstagramConnectionNotice status={unhealthy} redirectTo="/" />
        ) : dashboard?.priority ? (
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

function EmptyDashboard({ connected }: { connected: boolean }) {
  return (
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
  );
}
