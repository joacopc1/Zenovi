import { LogOut } from "lucide-react";
import { SettingsCard } from "@/components/settings/settings-card";
import { InstagramGlyph } from "@/components/ui/instagram-glyph";
import { signOut } from "@/components/shell/actions";
import { ProfileEditor } from "@/components/settings/profile-editor";
import { BETA_PLAN_NAME } from "@/lib/billing/plans";
import { getAccountContext } from "@/lib/data/account-context";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Cuenta · Ajustes" };

export default async function AccountSettingsPage() {
  const account = await getAccountContext();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <>
      <SettingsCard
        title="Perfil"
        footer={
          <form action={signOut}>
            <button type="submit" className="inline-flex items-center gap-1.5 text-[13px] text-graphite hover:text-ink">
              <LogOut aria-hidden="true" className="size-4" strokeWidth={1.75} />
              Cerrar sesión
            </button>
          </form>
        }
      >
        <ProfileEditor
          name={account?.displayName ?? ""}
          email={data.user?.email ?? null}
          avatarUrl={account?.avatarUrl ?? null}
          planLabel={`Plan ${BETA_PLAN_NAME}`}
        />
      </SettingsCard>

      <SettingsCard title="Marca">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-support text-xs text-graphite">Nombre de la marca</p>
            <p className="text-[15px] font-medium text-ink">{account?.workspace?.name ?? "—"}</p>
          </div>
          {account?.instagram?.username ? (
            <span className="inline-flex items-center gap-1.5 rounded-control border border-mist px-2.5 py-1.5 text-[13px] text-ink">
              <InstagramGlyph />@{account.instagram.username}
            </span>
          ) : (
            <span className="font-support text-[13px] text-graphite">Sin Instagram conectado</span>
          )}
        </div>
      </SettingsCard>
    </>
  );
}
