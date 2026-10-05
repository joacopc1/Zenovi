import { SettingsCard, SettingsRow } from "@/components/settings/settings-card";
import { BETA_PLAN_NAME } from "@/lib/billing/plans";
import { CREDIT_LOCK_MESSAGES } from "@/lib/credits/pricing";
import { getAccountContext } from "@/lib/data/account-context";
import { getCreditBalance } from "@/lib/data/credit-balance";

export const metadata = { title: "Facturación · Ajustes" };

const credits = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 0 });
const resetDate = new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "long", timeZone: "UTC" });

export default async function BillingSettingsPage() {
  const account = await getAccountContext();
  const balance = account?.workspace ? await getCreditBalance(account.workspace.id) : null;

  return (
    <>
      <SettingsCard title="Tu plan" description="Durante la beta Zenovi es gratis. Cuando lleguen los planes pagos te avisamos antes de cobrar nada.">
        <SettingsRow label={`Plan ${BETA_PLAN_NAME}`} hint="Todas las funciones, con créditos de IA por mes.">
          <span className="font-numeric font-semibold">US$0</span>
        </SettingsRow>
      </SettingsCard>

      <SettingsCard title="Créditos del mes" description="Los usan el Director y los análisis. Se renuevan el primer día de cada mes.">
        {!balance ? null : balance.locked ? (
          <p className="text-sm text-graphite">{CREDIT_LOCK_MESSAGES[balance.locked]}</p>
        ) : (
          <>
            <SettingsRow label="Del mes">
              <span className="font-numeric tabular-nums">{credits.format(balance.total)}</span>
            </SettingsRow>
            <SettingsRow label="Usados">
              <span className="font-numeric tabular-nums">{credits.format(balance.used)}</span>
            </SettingsRow>
            <SettingsRow label="Te quedan">
              <span className="font-numeric font-semibold tabular-nums">{credits.format(balance.remaining)}</span>
            </SettingsRow>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-control">
              <div className="h-full rounded-full bg-ink" style={{ width: `${balance.usedShare * 100}%` }} />
            </div>
            <p className="font-support mt-2 text-[11px] text-muted">Se renuevan el {resetDate.format(new Date(balance.resetsAt))}</p>
          </>
        )}
      </SettingsCard>
    </>
  );
}
