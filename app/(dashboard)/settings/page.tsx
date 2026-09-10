"use client";

import Link from "next/link";
import { AppHeader } from "@/components/shell/app-header";
import { useShellIdentity } from "@/components/shell/shell-identity";

export default function SettingsPage() {
  const identity = useShellIdentity();
  const instagramAccount = identity.instagram?.username
    ? `@${identity.instagram.username}`
    : "Sin cuenta conectada";

  return (
    <>
      <AppHeader title="Ajustes" />
      <div className="w-full px-5 py-8 md:px-8 md:py-10 lg:px-10">
        <h1 className="text-xl font-semibold tracking-[-0.02em]">Ajustes</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-graphite">
          Administrá la identidad de tu cuenta, la marca activa y sus conexiones.
        </p>

        <section className="mt-8 max-w-3xl overflow-hidden rounded-card border border-mist bg-paper">
          <SettingRow label="Nombre" value={identity.displayName} />
          <SettingRow label="Marca activa" value={identity.workspaceName} />
          <div className="grid gap-3 border-t border-mist p-5 sm:grid-cols-[10rem_1fr_auto] sm:items-center">
            <span className="text-xs text-muted">Instagram</span>
            <span className="text-sm text-ink">{instagramAccount}</span>
            <Link
              href="/onboarding/instagram"
              className="text-xs font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink"
            >
              Gestionar
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 border-t border-mist p-5 first:border-t-0 sm:grid-cols-[10rem_1fr] sm:items-center">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm text-ink">{value}</span>
    </div>
  );
}
