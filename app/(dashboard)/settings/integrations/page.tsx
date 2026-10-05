import Link from "next/link";
import { CircleAlert, CircleCheck } from "lucide-react";
import { SettingsCard } from "@/components/settings/settings-card";
import { getAccountContext } from "@/lib/data/account-context";

export const metadata = { title: "Integraciones · Ajustes" };

export default async function IntegrationsSettingsPage() {
  const account = await getAccountContext();
  const instagram = account?.instagram ?? null;
  const username = instagram?.username ? `@${instagram.username}` : null;
  const healthy = instagram?.status === "connected";

  return (
    <>
      <SettingsCard title="Instagram">
        {instagram ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className={`grid size-10 place-items-center rounded-full ${healthy ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
              {healthy ? <CircleCheck aria-hidden="true" className="size-5" strokeWidth={1.75} /> : <CircleAlert aria-hidden="true" className="size-5" strokeWidth={1.75} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{healthy ? "Instagram conectado" : "Instagram necesita atención"}</p>
              <p className="text-sm text-graphite">{healthy ? `${username ?? "Tu cuenta"} está conectada y se sincroniza sola.` : "La conexión no está funcionando. Volvé a conectarla para seguir sincronizando."}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/onboarding/instagram" className="inline-flex min-h-9 items-center rounded-control border border-mist px-3 text-[13px] font-medium text-ink hover:bg-canvas">
                {healthy ? "Gestionar" : "Reconectar"}
              </Link>
              <Link href="/settings/data#desconectar" className="inline-flex min-h-9 items-center rounded-control px-3 text-[13px] font-medium text-danger hover:bg-danger/5">
                Desconectar
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-graphite">Conectá tu cuenta profesional para ver tus métricas y usar la IA.</p>
            <Link href="/onboarding/instagram" className="inline-flex min-h-9 items-center rounded-control bg-ink px-4 text-[13px] font-semibold text-white hover:bg-ink/85">
              Conectar Instagram
            </Link>
          </div>
        )}
      </SettingsCard>

    </>
  );
}
