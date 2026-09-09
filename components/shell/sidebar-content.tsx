"use client";

import Link from "next/link";
import { signOut } from "./actions";
import { SidebarNav } from "./sidebar-nav";
import { useShellIdentity } from "./shell-identity";

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const identity = useShellIdentity();
  const instagramLabel = getInstagramLabel(identity.instagram);

  return (
    <>
      <div
        className="grid w-full grid-cols-[34px_1fr_auto] items-center gap-2.5 rounded-control p-1.5 text-left hover:bg-ink/[0.04]"
        aria-label="Workspace actual"
      >
        <span className="grid size-[34px] place-items-center rounded-[9px] bg-ink text-sm font-bold text-white">
          {identity.workspaceName[0]?.toLocaleUpperCase("es") ?? "Z"}
        </span>
        <span className="min-w-0">
          <strong className="block truncate text-sm">{identity.workspaceName}</strong>
          <small className="block truncate text-[10px] text-muted">Marca personal</small>
        </span>
      </div>

      <SidebarNav onNavigate={onNavigate} />

      <div className="mt-auto text-xs">
        <Link
          href="/onboarding/instagram"
          onClick={onNavigate}
          className="block border-t border-ink/[0.07] px-2.5 py-3 hover:bg-ink/[0.025]"
        >
          <div className="flex justify-between gap-3">
            <span>Instagram</span>
            <span className={`font-semibold ${instagramLabel.tone}`}>{instagramLabel.text} →</span>
          </div>
        </Link>
        <div className="border-t border-ink/[0.07] px-2.5 py-3">
          <div className="flex justify-between">
            <span>Créditos</span>
            <span className="text-muted">72%</span>
          </div>
          <div className="mt-2 h-0.5 bg-mist-strong">
            <span className="block h-full w-[72%] bg-ink" />
          </div>
        </div>
        <form action={signOut}>
          <button className="grid w-full grid-cols-[30px_1fr_auto] items-center gap-2 rounded-control p-1.5 text-left hover:bg-ink/[0.04]" type="submit">
            <span className="grid size-[30px] place-items-center rounded-full bg-mist-strong text-[10px] font-semibold">
              {identity.initials}
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-[11px]">{identity.displayName}</strong>
              <small className="text-[9px] text-muted">Propietario</small>
            </span>
            <span className="text-[9px] text-muted">Salir</span>
          </button>
        </form>
      </div>
    </>
  );
}

function getInstagramLabel(instagram: ReturnType<typeof useShellIdentity>["instagram"]) {
  if (!instagram) {
    return { text: "Configurar", tone: "text-warning" };
  }

  if (instagram.status === "connected") {
    return {
      text: instagram.username ? `@${instagram.username}` : "Conectado",
      tone: "text-success",
    };
  }

  if (instagram.status === "failed" || instagram.status === "action_required") {
    return { text: "Revisar", tone: "text-warning" };
  }

  return {
    text: instagram.username ? `@${instagram.username}` : "Conectando",
    tone: "text-graphite",
  };
}
